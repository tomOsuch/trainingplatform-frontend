/**
 * Jedyne miejsce z wartościami zależnymi od środowiska.
 *
 * Create React App udostępnia w kodzie wyłącznie zmienne z prefiksem REACT_APP_
 * i wstrzykuje je **podczas budowania**, nie w czasie działania aplikacji.
 * Oznacza to, że jeden zbudowany artefakt jest przypisany do jednego środowiska —
 * staging i produkcja wymagają osobnych buildów.
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:8080/api';
