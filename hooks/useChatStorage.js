import { useEffect, useCallback, useRef } from 'react';

export function useChatStorage(chatsBySubject, subjects, currentSubject, currentChatId) {
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  const getAuthToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('newton-auth-token');
  }, []);

  const saveToDB = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const dataToSave = {
        chatsBySubject,
        subjects,
        currentSubject,
        currentChatId
      };

      const dataString = JSON.stringify(dataToSave);
      if (dataString === lastSavedRef.current) return;

      await fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: dataString
      });

      lastSavedRef.current = dataString;
    } catch (error) {
      console.error('Failed to save to database:', error);
    }
  }, [chatsBySubject, subjects, currentSubject, currentChatId, getAuthToken]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToDB();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [chatsBySubject, subjects, currentSubject, currentChatId, saveToDB]);

  return { saveToDB };
}

export async function loadFromDB() {
  const token = localStorage.getItem('newton-auth-token');
  if (!token) return null;

  try {
    const response = await fetch('/api/chat/load', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.chatData;
  } catch (error) {
    console.error('Failed to load from database:', error);
    return null;
  }
}
