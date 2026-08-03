package com.neueda.ruleengine;

import com.neueda.transactionmonitoring.model.TransactionRecord;

public interface Rule {

    boolean evaluate(TransactionRecord transaction);

    String getRuleName();

    String getSeverity();
}