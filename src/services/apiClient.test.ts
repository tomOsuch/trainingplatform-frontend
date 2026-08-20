import { apiFetch, setAuthToken, setOnUnauthorized, ApiRequestError } from "./apiClient";
import { mockFetch } from "../test-utils";

describe("apiClient", () => {
  // apiClient trzyma token i handler w zmiennych modułu — przed każdym testem czyścimy stan
  beforeEach(() => {
    setAuthToken(null);
    setOnUnauthorized(null);
  });

  afterEach(() => jest.restoreAllMocks());

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

  test("401 z tokenem wywołuje auto-wylogowanie", async () => {
    mockFetch({ status: 401, body: { message: "Unauthorized" } });
    const onUnauthorized = jest.fn();
    setAuthToken("wygasly-token");
    setOnUnauthorized(onUnauthorized);

    await expect(apiFetch("/profile")).rejects.toBeInstanceOf(ApiRequestError);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  // REGRESJA: 401 przy logowaniu (bez tokenu) nie może wylogowywać,
  // inaczej literówka w haśle powoduje przekierowanie zamiast komunikatu
  test("401 bez tokenu NIE wywołuje auto-wylogowania", async () => {
    mockFetch({ status: 401, body: { message: "Bad credentials" } });
    const onUnauthorized = jest.fn();
    setOnUnauthorized(onUnauthorized);

    await expect(apiFetch("/auth/login", { method: "POST" })).rejects.toBeInstanceOf(ApiRequestError);

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  // REGRESJA: pusty tydzień zwracał 200 z pustym ciałem -> "Unexpected end of JSON input"
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

    const apiErr: ApiRequestError = await apiFetch("/training-plans", { method: "POST" }).then(
      () => {
        throw new Error("powinno rzucić wyjątkiem");
      },
      (err) => err,
    );

    expect(apiErr).toBeInstanceOf(ApiRequestError);
    expect(apiErr.status).toBe(400);
    expect(apiErr.message).toBe("Błąd walidacji");
    expect(apiErr.errors).toEqual({ title: "Pole wymagane" });
  });

  test("błąd bez poprawnego JSON-a dostaje domyślny komunikat", async () => {
    // tu potrzebujemy odpowiedzi, której json() rzuca — piszemy atrapę ręcznie
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
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