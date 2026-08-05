package com.neueda.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Service
@Primary
public class InternalSdnListScreeningService implements SdnScreeningService {

    private final boolean enabled;
    private final Map<String, String> normalizedToDisplayName;

    public InternalSdnListScreeningService(
            @Value("${sdn.local-list.enabled:true}") final boolean enabled,
            @Value("${sdn.local-list.file:sdn-payee-list.txt}") final String listFile
    ) {
        this.enabled = enabled;
        this.normalizedToDisplayName = loadList(listFile);
    }

    @Override
    public ScreeningResult screenPayee(final String payeeName, final Double minimumConfidence) {
        if (!enabled) {
            return ScreeningResult.notAvailable(payeeName, "Internal SDN list screening is disabled");
        }
        if (payeeName == null || payeeName.trim().isEmpty()) {
            return ScreeningResult.notAvailable(payeeName, "Payee name is required for SDN screening");
        }

        final String normalizedPayee = normalize(payeeName);
        for (Map.Entry<String, String> entry : normalizedToDisplayName.entrySet()) {
            final String normalizedSdnName = entry.getKey();
            if (isMatch(normalizedPayee, normalizedSdnName)) {
                return ScreeningResult.match(
                        payeeName.trim(),
                        entry.getValue(),
                        1.0d,
                        "Matched against internal SDN list"
                );
            }
        }

        return ScreeningResult.noMatch(payeeName.trim(), "No internal SDN list matches found");
    }

    private static boolean isMatch(final String normalizedPayee, final String normalizedSdnName) {
        if (normalizedPayee.equals(normalizedSdnName)) {
            return true;
        }
        // Allow partial matching for typical suffix/prefix variations in legal entity names.
        return normalizedPayee.length() >= 8 &&
                (normalizedPayee.contains(normalizedSdnName) || normalizedSdnName.contains(normalizedPayee));
    }

    private static Map<String, String> loadList(final String listFile) {
        final Map<String, String> result = new LinkedHashMap<>();

        try (InputStream inputStream = Thread.currentThread().getContextClassLoader().getResourceAsStream(listFile)) {
            if (inputStream == null) {
                throw new IllegalStateException("SDN list file not found on classpath: " + listFile);
            }

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    final String trimmed = line.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                        continue;
                    }
                    result.put(normalize(trimmed), trimmed);
                }
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read SDN list file: " + listFile, exception);
        }

        if (result.isEmpty()) {
            throw new IllegalStateException("SDN list file has no entries: " + listFile);
        }

        return result;
    }

    private static String normalize(final String value) {
        return value
                .toLowerCase()
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}

