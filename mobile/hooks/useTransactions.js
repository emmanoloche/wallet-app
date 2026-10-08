// react custom hook file

import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";

export const useTransactions = (userId) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/transactions/${userId}`
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Transactions API (${response.status}): ${text}`
        );
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [userId]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/transactions/summary/${userId}`
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Summary API (${response.status}): ${text}`
        );
      }

      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, [userId]);

  // Load transactions and summary
  const loadData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      await Promise.all([
        fetchTransactions(),
        fetchSummary(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions, fetchSummary, userId]);

  // Delete transaction
  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/transactions/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Failed to delete transaction (${response.status}): ${text}`
        );
      }

      // Refresh data after deletion
      await loadData();

      Alert.alert(
        "Success",
        "Transaction deleted successfully"
      );
    } catch (error) {
      console.error("Error deleting transaction:", error);
      Alert.alert("Error", error.message);
    }
  };

  return {
    transactions,
    summary,
    isLoading,
    loadData,
    deleteTransaction,
  };
};
