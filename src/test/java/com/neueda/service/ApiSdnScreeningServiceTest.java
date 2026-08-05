package com.neueda.service;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class ApiSdnScreeningServiceTest {

    private HttpServer server;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void returnsNotMatchedWhenResponseHasArrayWithoutConfidence() throws Exception {
        startServer(200, "{\"matches\":[{\"name\":\"Random Company\"}]}");

        ApiSdnScreeningService service = new ApiSdnScreeningService(
                true,
                endpoint("/search"),
                "name",
                "demo-key",
                "Authorization",
                true,
                2000
        );

        SdnScreeningService.ScreeningResult result = service.screenPayee("Normal Vendor", 0.8d);

        Assertions.assertTrue(result.available());
        Assertions.assertFalse(result.matched());
        Assertions.assertTrue(result.reason().contains("without confidence"));
    }

    @Test
    void returnsMatchWhenResponseHasHighConfidence() throws Exception {
        startServer(200, "{\"results\":[{\"name\":\"ACME SANCTIONS LTD\",\"score\":0.95}]}");

        ApiSdnScreeningService service = new ApiSdnScreeningService(
                true,
                endpoint("/search"),
                "name",
                "demo-key",
                "Authorization",
                true,
                2000
        );

        SdnScreeningService.ScreeningResult result = service.screenPayee("ACME", 0.8d);

        Assertions.assertTrue(result.available());
        Assertions.assertTrue(result.matched());
        Assertions.assertEquals("ACME SANCTIONS LTD", result.matchedName());
    }

    @Test
    void returnsNotAvailableWhenProviderFailsAndFailOpenIsTrue() throws Exception {
        startServer(500, "{\"error\":\"internal\"}");

        ApiSdnScreeningService service = new ApiSdnScreeningService(
                true,
                endpoint("/search"),
                "name",
                "demo-key",
                "Authorization",
                true,
                2000
        );

        SdnScreeningService.ScreeningResult result = service.screenPayee("Any Vendor", 0.8d);

        Assertions.assertFalse(result.available());
        Assertions.assertFalse(result.matched());
    }

    private void startServer(final int statusCode, final String body) throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/search", new JsonHandler(statusCode, body));
        server.start();
    }

    private String endpoint(final String path) {
        return "http://localhost:" + server.getAddress().getPort() + path;
    }

    private record JsonHandler(int statusCode, String body) implements HttpHandler {
        @Override
        public void handle(final HttpExchange exchange) throws IOException {
            byte[] payload = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(statusCode, payload.length);
            try (OutputStream output = exchange.getResponseBody()) {
                output.write(payload);
            }
        }
    }
}

