package com.neueda.service;

public interface SdnScreeningService {

    ScreeningResult screenPayee(String payeeName, Double minimumConfidence);

    record ScreeningResult(
            boolean available,
            boolean matched,
            String searchedName,
            String matchedName,
            Double confidence,
            String source,
            String reason
    ) {
        public static ScreeningResult notAvailable(final String searchedName, final String reason) {
            return new ScreeningResult(false, false, searchedName, null, null, "SDN_API", reason);
        }

        public static ScreeningResult noMatch(final String searchedName, final String reason) {
            return new ScreeningResult(true, false, searchedName, null, null, "SDN_API", reason);
        }

        public static ScreeningResult match(
                final String searchedName,
                final String matchedName,
                final Double confidence,
                final String reason
        ) {
            return new ScreeningResult(true, true, searchedName, matchedName, confidence, "SDN_API", reason);
        }
    }
}

