import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, mockFetch } from "../test-utils";
import ProfilePage from "./ProfilePage";

const profile = {
  id: 1,
  email: "jan@example.com",
  firstName: "Jan",
  lastName: "Kowalski",
  birthDate: "1990-05-12",
  role: "USER" as const,
};

describe("ProfilePage", () => {
  afterEach(() => jest.restoreAllMocks());

  test("wypełnia formularz danymi z API", async () => {
    mockFetch({ status: 200, body: profile });
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByLabelText(/^Imię/)).toHaveValue("Jan");
    expect(screen.getByLabelText(/^Nazwisko/)).toHaveValue("Kowalski");
    expect(screen.getByLabelText(/^Data urodzenia/)).toHaveValue("1990-05-12");
  });

  test("email jest widoczny, ale zablokowany do edycji", async () => {
    mockFetch({ status: 200, body: profile });
    renderWithProviders(<ProfilePage />);

    const email = await screen.findByDisplayValue("jan@example.com");
    expect(email).toBeDisabled();
  });

  test("odrzuca zbyt krótkie imię", async () => {
    const fetchSpy = mockFetch({ status: 200, body: profile });
    renderWithProviders(<ProfilePage />);

    const firstName = await screen.findByLabelText(/^Imię/);
    await userEvent.clear(firstName);
    await userEvent.type(firstName, "J");
    await userEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    expect(screen.getByText("Imię musi mieć co najmniej 2 znaki")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1); // tylko początkowe GET
  });

  test("zapisuje dane osobowe i potwierdza komunikatem", async () => {
    const fetchSpy = mockFetch(
      { status: 200, body: profile },                               // GET przy montowaniu
      { status: 200, body: { ...profile, firstName: "Janusz" } },   // PUT
      { status: 200, body: { ...profile, firstName: "Janusz" } }    // GET z refreshProfile
    );
    renderWithProviders(<ProfilePage />);

    const firstName = await screen.findByLabelText(/^Imię/);
    await userEvent.clear(firstName);
    await userEvent.type(firstName, "Janusz");
    await userEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    expect(await screen.findByText("Dane zostały zapisane")).toBeInTheDocument();

    const [url, options] = fetchSpy.mock.calls[1];
    expect(url).toContain("/profile");
    expect(options!.method).toBe("PUT");
    expect(JSON.parse(options!.body as string)).toEqual({
      firstName: "Janusz",
      lastName: "Kowalski",
      birthDate: "1990-05-12",
    });
  });

  test("wymaga zgodnych nowych haseł", async () => {
    const fetchSpy = mockFetch({ status: 200, body: profile });
    renderWithProviders(<ProfilePage />);

    await userEvent.type(await screen.findByLabelText(/^Obecne hasło/), "stare123");
    await userEvent.type(screen.getByLabelText(/^Nowe hasło/), "nowe12345");
    await userEvent.type(screen.getByLabelText(/^Potwierdź nowe hasło/), "inne12345");
    await userEvent.click(screen.getByRole("button", { name: "Zmień hasło" }));

    expect(screen.getByText("Hasła muszą być identyczne")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test("po zmianie hasła czyści pola i potwierdza", async () => {
    mockFetch({ status: 200, body: profile }, { status: 200 });
    renderWithProviders(<ProfilePage />);

    await userEvent.type(await screen.findByLabelText(/^Obecne hasło/), "stare123");
    await userEvent.type(screen.getByLabelText(/^Nowe hasło/), "nowe12345");
    await userEvent.type(screen.getByLabelText(/^Potwierdź nowe hasło/), "nowe12345");
    await userEvent.click(screen.getByRole("button", { name: "Zmień hasło" }));

    expect(await screen.findByText("Hasło zostało zmienione")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Obecne hasło/)).toHaveValue("");
    expect(screen.getByLabelText(/^Nowe hasło/)).toHaveValue("");
  });

  test("informuje o nieprawidłowym obecnym haśle", async () => {
    mockFetch(
      { status: 200, body: profile },
      { status: 400, body: { message: "Nieprawidłowe hasło" } }
    );
    renderWithProviders(<ProfilePage />);

    await userEvent.type(await screen.findByLabelText(/^Obecne hasło/), "zle-haslo");
    await userEvent.type(screen.getByLabelText(/^Nowe hasło/), "nowe12345");
    await userEvent.type(screen.getByLabelText(/^Potwierdź nowe hasło/), "nowe12345");
    await userEvent.click(screen.getByRole("button", { name: "Zmień hasło" }));

    expect(await screen.findByText("Obecne hasło jest nieprawidłowe")).toBeInTheDocument();
  });
});