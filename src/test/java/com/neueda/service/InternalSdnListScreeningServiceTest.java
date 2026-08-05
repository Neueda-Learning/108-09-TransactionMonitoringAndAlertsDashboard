package com.neueda.service;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class InternalSdnListScreeningServiceTest {

    @Test
    void matchesPayeeFromInternalList() {
        InternalSdnListScreeningService service =
                new InternalSdnListScreeningService(true, "sdn-payee-list.txt");

        SdnScreeningService.ScreeningResult result =
                service.screenPayee("Islamic Revolutionary Guard Corps", 0.8d);

        Assertions.assertTrue(result.available());
        Assertions.assertTrue(result.matched());
        Assertions.assertEquals("Islamic Revolutionary Guard Corps", result.matchedName());
    }

    @Test
    void doesNotMatchUnknownPayee() {
        InternalSdnListScreeningService service =
                new InternalSdnListScreeningService(true, "sdn-payee-list.txt");

        SdnScreeningService.ScreeningResult result =
                service.screenPayee("Totally Safe Vendor Pvt Ltd", 0.8d);

        Assertions.assertTrue(result.available());
        Assertions.assertFalse(result.matched());
    }
}

