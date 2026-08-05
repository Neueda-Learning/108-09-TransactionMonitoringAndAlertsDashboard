package com.neueda.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ApiSdnScreeningService implements SdnScreeningService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ApiSdnScreeningService.class);

    private static final Pattern NAME_PATTERN = Pattern.compile("\"(?:name|entityName|sdnName|payeeName)\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern CONFIDENCE_PATTERN = Pattern.compile("\"(?:confidence|score|matchScore)\"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)");
    private static final Pattern EXPLICIT_MATCH_TRUE_PATTERN = Pattern.compile(
            "\"(?:match|matched|isMatch|sdnMatch)\"\\s*:\\s*true",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern EXPLICIT_MATCH_FALSE_PATTERN = Pattern.compile(
            "\"(?:match|matched|isMatch|sdnMatch)\"\\s*:\\s*false",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern MATCH_ARRAY_PATTERN = Pattern.compile(
            "\"(?:matches|results|data)\"\\s*:\\s*\\[(.*?)\\]",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    private final HttpClient httpClient;
    private final boolean enabled;
    private final String endpoint;
    private final String queryParam;
    private final String apiKey;
    private final String apiKeyHeader;
    private final boolean failOpen;
    private final Duration requestTimeout;

    public ApiSdnScreeningService(
            @Value("${sdn.api.enabled:false}") final boolean enabled,
            @Value("${sdn.api.url:}") final String endpoint,
            @Value("${sdn.api.query-param:name}") final String queryParam,
            @Value("${sdn.api.api-key:}") final String apiKey,
            @Value("${sdn.api.api-key-header:X-API-Key}") final String apiKeyHeader,
            @Value("${sdn.api.fail-open:true}") final boolean failOpen,
            @Value("${sdn.api.timeout-ms:2500}") final int timeoutMillis
    ) {
        this.enabled = enabled;
        this.endpoint = endpoint;
        this.queryParam = queryParam;
        this.apiKey = apiKey;
        this.apiKeyHeader = apiKeyHeader;
        this.failOpen = failOpen;
        this.requestTimeout = Duration.ofMillis(Math.max(500, timeoutMillis));
        this.httpClient = HttpClient.newBuilder().connectTimeout(this.requestTimeout).build();
    }

    @Override
    public ScreeningResult screenPayee(final String payeeName, final Double minimumConfidence) {
        if (!enabled) {
            return ScreeningResult.notAvailable(payeeName, "SDN screening is disabled");
        }
        if (payeeName == null || payeeName.trim().isEmpty()) {
            return ScreeningResult.notAvailable(payeeName, "Payee name is required for SDN screening");
        }
        if (endpoint == null || endpoint.trim().isEmpty()) {
            return ScreeningResult.notAvailable(payeeName, "SDN API endpoint is not configured");
        }

        try {
            final URI requestUri = buildUri(payeeName.trim());
            final HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(requestUri)
                    .timeout(requestTimeout)
                    .header("Accept", "application/json")
                    .GET();

            if (apiKey != null && !apiKey.trim().isEmpty()) {
                requestBuilder.header(apiKeyHeader, resolveAuthHeaderValue());
            }

            final HttpResponse<String> response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return toFailure(payeeName, "SDN API responded with status " + response.statusCode());
            }

            return evaluateResponse(payeeName.trim(), response.body(), minimumConfidence);
        } catch (final IOException | InterruptedException exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return toFailure(payeeName, "SDN API call failed: " + exception.getMessage());
        }
    }

    private ScreeningResult evaluateResponse(
            final String payeeName,
            final String responseBody,
            final Double minimumConfidence
    ) {
        final String normalizedBody = responseBody == null ? "" : responseBody.toLowerCase(Locale.ROOT);
        final String compactBody = normalizedBody.replaceAll("\\s+", "");

        if (EXPLICIT_MATCH_TRUE_PATTERN.matcher(responseBody == null ? "" : responseBody).find()) {
            return ScreeningResult.match(
                    payeeName,
                    extractMatchedName(responseBody, payeeName),
                    extractConfidence(responseBody),
                    "SDN API returned an explicit match"
            );
        }

        if (EXPLICIT_MATCH_FALSE_PATTERN.matcher(responseBody == null ? "" : responseBody).find()) {
            return ScreeningResult.noMatch(payeeName, "SDN API returned explicit non-match");
        }

        if (containsAny(
                compactBody,
                "\"sanctioned\":true",
                "\"issanctioned\":true",
                "\"is_sanctioned\":true",
                "\"hasmatch\":true",
                "\"has_match\":true"
        )) {
            return ScreeningResult.match(
                    payeeName,
                    extractMatchedName(responseBody, payeeName),
                    extractConfidence(responseBody),
                    "SDN API returned sanctions match"
            );
        }

        final Matcher matchArrayMatcher = MATCH_ARRAY_PATTERN.matcher(responseBody == null ? "" : responseBody);
        if (matchArrayMatcher.find() && hasJsonObject(matchArrayMatcher.group(1))) {
            final Double confidence = extractConfidence(responseBody);
            final double threshold = normalizeConfidenceThreshold(minimumConfidence);
            if (confidence != null && confidence >= threshold) {
                return ScreeningResult.match(
                        payeeName,
                        extractMatchedName(responseBody, payeeName),
                        confidence,
                        "SDN API returned one or more potential matches"
                );
            }
            if (confidence == null) {
                return ScreeningResult.noMatch(
                        payeeName,
                        "Potential matches found without confidence score"
                );
            }
            return ScreeningResult.noMatch(payeeName,
                    "Potential matches found but below confidence threshold " + threshold);
        }

        if (compactBody.startsWith("[") && hasJsonObject(compactBody)) {
            final Double confidence = extractConfidence(responseBody);
            final double threshold = normalizeConfidenceThreshold(minimumConfidence);
            if (confidence != null && confidence >= threshold) {
                return ScreeningResult.match(
                        payeeName,
                        extractMatchedName(responseBody, payeeName),
                        confidence,
                        "SDN API returned scored list match"
                );
            }
            return ScreeningResult.noMatch(
                    payeeName,
                    "SDN API returned list without explicit/strong match"
            );
        }

        return ScreeningResult.noMatch(payeeName, "No SDN matches found");
    }

    private static boolean hasJsonObject(final String value) {
        return value != null && value.contains("{") && value.contains("}");
    }

    private ScreeningResult toFailure(final String payeeName, final String reason) {
        LOGGER.warn(reason);
        if (failOpen) {
            return ScreeningResult.notAvailable(payeeName, reason);
        }
        return ScreeningResult.match(payeeName, payeeName, null,
                "SDN screening unavailable and fail-open disabled");
    }

    private URI buildUri(final String payeeName) {
        final String encodedPayee = URLEncoder.encode(payeeName, StandardCharsets.UTF_8);
        final String separator = endpoint.contains("?") ? "&" : "?";
        return URI.create(endpoint + separator + queryParam + "=" + encodedPayee);
    }

    private String resolveAuthHeaderValue() {
        final String normalizedHeader = apiKeyHeader == null ? "" : apiKeyHeader.trim().toLowerCase(Locale.ROOT);
        final String trimmedKey = apiKey.trim();
        if ("authorization".equals(normalizedHeader) && !trimmedKey.toLowerCase(Locale.ROOT).startsWith("bearer ")) {
            return "Bearer " + trimmedKey;
        }
        return trimmedKey;
    }

    private static boolean containsAny(final String value, final String... markers) {
        if (value == null) {
            return false;
        }
        for (final String marker : markers) {
            if (value.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    private static String extractMatchedName(final String responseBody, final String fallback) {
        if (responseBody == null) {
            return fallback;
        }
        final Matcher matcher = NAME_PATTERN.matcher(responseBody);
        return matcher.find() ? matcher.group(1) : fallback;
    }

    private static Double extractConfidence(final String responseBody) {
        if (responseBody == null) {
            return null;
        }
        final Matcher matcher = CONFIDENCE_PATTERN.matcher(responseBody);
        if (!matcher.find()) {
            return null;
        }
        final double raw = Double.parseDouble(matcher.group(1));
        return raw > 1d ? raw / 100d : raw;
    }

    private static double normalizeConfidenceThreshold(final Double minimumConfidence) {
        if (minimumConfidence == null || minimumConfidence <= 0d) {
            return 0.8d;
        }
        return minimumConfidence > 1d ? minimumConfidence / 100d : minimumConfidence;
    }
}
