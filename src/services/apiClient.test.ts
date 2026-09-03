import {
  apiFetch,
  setAuthToken,
  setOnSessionEnd,
  restoreSession,
  ApiRequestError,
} from "./apiClient";
import { mockFetch, sampleLoginResponse } from "../test-utils";

// ścieżki wywołań fetch — do sprawdzania, co i ile razy poszło na serwer
const calledPaths = (spy: jest.SpyInstance) =>
  spy.mock.calls.map(([url]) => String(url));

describe("apiClient", () => {
  beforeEach(() => {
    setAuthToken(null);
    setOnSessionEnd(null);
  });

  afterEach(() => jest.restoreAllMocks());

  describe("żądania", () => {
    test("dokłada nagłówek Authorization, gdy token jest ustawiony", async () => {
      const fetchSpy = mockFetch({ status: 200, body: { ok: true } });
      setAuthToken("token-abc");

      await apiFetch("/profile");

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe("http://localhost:8080/api/profile");
      expect((options!.headers as Record<string, string>).Authorization).toBe("Bearer token-abc");
    });

    test("nie dokłada nagłówka, gdy tokenu nie ma", async () => {
      const fetchSpy = mockFetch({ status: 200, body: { ok: true } });

      await apiFetch("/auth/login", { method: "POST" });

      const [, options] = fetchSpy.mock.calls[0];
      expect((options!.headers as Record<string, string>).Authorization).toBeUndefined();
    });

    // ciasteczko z tokenem odświeżającym jest HttpOnly — bez tego przeglądarka go nie odeśle
    test("każde żądanie idzie z credentials: include", async () => {
      const fetchSpy = mockFetch({ status: 200, body: { ok: true } });

      await apiFetch("/profile");

      const [, options] = fetchSpy.mock.calls[0];
      expect(options!.credentials).toBe("include");
    });
  });

  describe("ciche odświeżanie", () => {
    test("po 401 odświeża sesję i ponawia przerwane żądanie", async () => {
      const fetchSpy = mockFetch(
        { status: 401, body: { message: "Token wygasł" } },        // pierwsze żądanie
        { status: 200, body: { ...sampleLoginResponse, token: "nowy-token" } }, // refresh
        { status: 200, body: { id: 1 } }                            // ponowienie
      );
      setAuthToken("stary-token");

      const result = await apiFetch<{ id: number }>("/profile");

      expect(result).toEqual({ id: 1 });
      expect(calledPaths(fetchSpy)).toEqual([
        "http://localhost:8080/api/profile",
        "http://localhost:8080/api/auth/refresh",
        "http://localhost:8080/api/profile",
      ]);

      // ponowienie musi użyć nowego tokenu, nie starego
      const [, retryOptions] = fetchSpy.mock.calls[2];
      expect((retryOptions!.headers as Record<string, string>).Authorization).toBe(
        "Bearer nowy-token"
      );
    });

    // REGRESJA: 401 z logowania to złe hasło, nie wygasła sesja.
    // Odświeżanie w reakcji na nie kończy się pętlą login → 401 → refresh → 401.
    test("nie odświeża po 401 z endpointu uwierzytelniania", async () => {
      const fetchSpy = mockFetch({ status: 401, body: { message: "Bad credentials" } });
      const onSessionEnd = jest.fn();
      setOnSessionEnd(onSessionEnd);

      const error = (await apiFetch("/auth/login", { method: "POST" }).catch((e) => e)) as ApiRequestError;

      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error.status).toBe(401);
      expect(calledPaths(fetchSpy)).toEqual(["http://localhost:8080/api/auth/login"]);
      expect(onSessionEnd).not.toHaveBeenCalled();
    });

    // Rotacja tokenów: drugie odświeżenie przedstawiłoby token już wymieniony,
    // co backend uzna za kradzież sesji i unieważni wszystkie sesje użytkownika.
    test("równoległe żądania z 401 wywołują dokładnie jedno odświeżenie", async () => {
      const fetchSpy = mockFetch(
        { status: 401 }, { status: 401 }, { status: 401 },          // trzy równoległe żądania
        { status: 200, body: sampleLoginResponse },                  // jedno odświeżenie
        { status: 200, body: { id: 1 } },
        { status: 200, body: { id: 2 } },
        { status: 200, body: { id: 3 } }
      );
      setAuthToken("stary-token");

      await Promise.all([
        apiFetch("/training-plans"),
        apiFetch("/workout-logs"),
        apiFetch("/profile"),
      ]);

      const refreshCalls = calledPaths(fetchSpy).filter((p) => p.endsWith("/auth/refresh"));
      expect(refreshCalls).toHaveLength(1);
      expect(fetchSpy).toHaveBeenCalledTimes(7);
    });

    test("nieudane odświeżenie kończy sesję i przekazuje komunikat", async () => {
      mockFetch(
        { status: 401 },
        { status: 401, body: { message: "Sesja została unieważniona ze względów bezpieczeństwa" } }
      );
      const onSessionEnd = jest.fn();
      setAuthToken("stary-token");
      setOnSessionEnd(onSessionEnd);

      await expect(apiFetch("/profile")).rejects.toBeInstanceOf(ApiRequestError);

      expect(onSessionEnd).toHaveBeenCalledWith(
        "Sesja została unieważniona ze względów bezpieczeństwa"
      );
    });

    test("nie ponawia żądania po nieudanym odświeżeniu", async () => {
      const fetchSpy = mockFetch({ status: 401 }, { status: 401 });
      setAuthToken("stary-token");
      setOnSessionEnd(jest.fn());

      await apiFetch("/profile").catch(() => {});

      expect(fetchSpy).toHaveBeenCalledTimes(2); // żądanie + odświeżenie, bez ponowienia
    });
  });

  describe("odtwarzanie sesji", () => {
    test("zwraca sesję i zapamiętuje token", async () => {
      const fetchSpy = mockFetch({ status: 200, body: sampleLoginResponse });

      const session = await restoreSession();

      expect(session).toEqual(sampleLoginResponse);
      expect(calledPaths(fetchSpy)).toEqual(["http://localhost:8080/api/auth/refresh"]);

      // token z odtworzonej sesji trafia do kolejnych żądań
      mockFetch({ status: 200, body: {} });
      await apiFetch("/profile");
      const [, options] = fetchSpy.mock.calls[1];
      expect((options!.headers as Record<string, string>).Authorization).toBe(
        `Bearer ${sampleLoginResponse.token}`
      );
    });

    test("zwraca null, gdy nie ma ważnego ciasteczka", async () => {
      mockFetch({ status: 401, body: { message: "Brak tokenu" } });

      await expect(restoreSession()).resolves.toBeNull();
    });
  });

  describe("odpowiedzi i błędy", () => {
    test("pusta odpowiedź 200 zwraca undefined zamiast rzucać błędem", async () => {
      mockFetch({ status: 200 });
      await expect(apiFetch("/training-plans")).resolves.toBeUndefined();
    });

    test("204 No Content zwraca undefined", async () => {
      mockFetch({ status: 204 });
      await expect(apiFetch("/workout-logs/1", { method: "DELETE" })).resolves.toBeUndefined();
    });

    test("błąd 400 niesie status i mapę błędów pól", async () => {
      mockFetch({
        status: 400,
        body: { message: "Błąd walidacji", errors: { title: "Pole wymagane" } },
      });

      const error = (await apiFetch("/training-plans", { method: "POST" }).catch((e) => e)) as ApiRequestError;

      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error.status).toBe(400);
      expect(error.errors).toEqual({ title: "Pole wymagane" });
    });

    test("429 niesie czas oczekiwania z nagłówka Retry-After", async () => {
      mockFetch({
        status: 429,
        body: { message: "Zbyt wiele prób. Spróbuj ponownie za chwilę." },
        headers: { "Retry-After": "120" },
      });

      const error = (await apiFetch("/auth/login", { method: "POST" }).catch((e) => e)) as ApiRequestError;

      expect(error.status).toBe(429);
      expect(error.retryAfter).toBe(120);
    });

    test("błąd bez poprawnego JSON-a dostaje domyślny komunikat", async () => {
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: { get: () => null },
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
        text: async () => "",
      } as unknown as Response);

      await expect(apiFetch("/profile")).rejects.toMatchObject({
        status: 500,
        message: "Wystąpił nieoczekiwany błąd",
      });
    });
  });
});