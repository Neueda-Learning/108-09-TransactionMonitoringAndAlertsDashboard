package com.neueda.controller;

import com.neueda.entity.Transaction;
import com.neueda.service.TransactionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock
    private TransactionService service;

    @InjectMocks
    private TransactionController controller;

    @Test
    void getAllTransactionsReturnsServiceData() {
        List<Transaction> expected = List.of(buildTransaction("TXN-001"), buildTransaction("TXN-002"));
        when(service.getAllTransactions()).thenReturn(expected);

        List<Transaction> actual = controller.getAllTransactions();

        assertEquals(expected, actual);
        verify(service).getAllTransactions();
    }

    @Test
    void getTransactionReturnsServiceData() {
        Transaction expected = buildTransaction("TXN-123");
        when(service.getTransactionById("TXN-123")).thenReturn(expected);

        Transaction actual = controller.getTransaction("TXN-123");

        assertEquals(expected, actual);
        verify(service).getTransactionById("TXN-123");
    }

    @Test
    void addTransactionDelegatesToService() {
        Transaction request = buildTransaction("TXN-500");
        Transaction expected = buildTransaction("TXN-500");
        when(service.addTransaction(request)).thenReturn(expected);

        Transaction actual = controller.addTransaction(request);

        assertEquals(expected, actual);
        verify(service).addTransaction(request);
    }

    @Test
    void updateTransactionDelegatesToService() {
        Transaction request = buildTransaction("TXN-777");
        request.setAmount(440.0);

        Transaction expected = buildTransaction("TXN-777");
        expected.setAmount(440.0);

        when(service.updateTransaction("TXN-777", request)).thenReturn(expected);

        Transaction actual = controller.updateTransaction("TXN-777", request);

        assertEquals(expected, actual);
        verify(service).updateTransaction("TXN-777", request);
    }

    @Test
    void deleteTransactionReturnsNoContentAndCallsService() {
        ResponseEntity<Void> response = controller.deleteTransaction("TXN-900");

        assertNotNull(response);
        assertEquals(204, response.getStatusCode().value());
        assertNull(response.getBody());
        verify(service).deleteTransaction("TXN-900");
    }

    @Test
    void getTransactionPropagatesServiceException() {
        ResponseStatusException exception = new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,
                "Transaction not found");
        when(service.getTransactionById("TXN-MISSING")).thenThrow(exception);

        ResponseStatusException thrown = assertThrows(ResponseStatusException.class,
                () -> controller.getTransaction("TXN-MISSING"));

        assertSame(exception, thrown);
        verify(service).getTransactionById("TXN-MISSING");
    }

    @Test
    void addTransactionPropagatesServiceException() {
        Transaction request = buildTransaction("TXN-DUPLICATE");
        ResponseStatusException exception = new ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT,
                "Transaction ID already exists");
        when(service.addTransaction(request)).thenThrow(exception);

        ResponseStatusException thrown = assertThrows(ResponseStatusException.class,
                () -> controller.addTransaction(request));

        assertSame(exception, thrown);
        verify(service).addTransaction(request);
    }

    @Test
    void updateTransactionPropagatesServiceException() {
        Transaction request = buildTransaction("TXN-404");
        ResponseStatusException exception = new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,
                "Transaction not found");
        when(service.updateTransaction("TXN-404", request)).thenThrow(exception);

        ResponseStatusException thrown = assertThrows(ResponseStatusException.class,
                () -> controller.updateTransaction("TXN-404", request));

        assertSame(exception, thrown);
        verify(service).updateTransaction("TXN-404", request);
    }

    @Test
    void deleteTransactionPropagatesServiceException() {
        ResponseStatusException exception = new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,
                "Transaction not found");
        doThrow(exception).when(service).deleteTransaction("TXN-404");

        ResponseStatusException thrown = assertThrows(ResponseStatusException.class,
                () -> controller.deleteTransaction("TXN-404"));

        assertSame(exception, thrown);
        verify(service).deleteTransaction("TXN-404");
    }

    private Transaction buildTransaction(String transactionId) {
        Transaction transaction = new Transaction();
        transaction.setId(1L);
        transaction.setTransactionId(transactionId);
        transaction.setAccountId("ACC-01");
        transaction.setPayeeId("PAY-01");
        transaction.setPayeeName("John Payee");
        transaction.setAmount(250.0);
        transaction.setCurrency("USD");
        transaction.setTransactionType("TRANSFER");
        transaction.setTransactionTime(LocalDateTime.of(2026, 1, 1, 10, 15));
        transaction.setDescription("Unit test transaction");
        transaction.setStatus("SUCCESS");
        return transaction;
    }
}
