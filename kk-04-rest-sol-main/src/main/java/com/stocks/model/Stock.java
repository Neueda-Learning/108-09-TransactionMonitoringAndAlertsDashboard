package com.stocks.model;

/** Carried forward from Module 02 solution. */
public record Stock(
        Long id,
        String symbol,
        String companyName,
        String sector,
        String exchange
) {}
