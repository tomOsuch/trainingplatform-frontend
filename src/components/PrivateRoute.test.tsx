import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, Route, Routes } from "react-router-dom";
import { renderWithProviders, mockFetch, sampleLoginResponse } from "../test-utils";
import { useAuth } from "../context/AuthContext";
import PrivateRoute from "./PrivateRoute";

const sampleProfile = {
  userId: 1,
  firstName: "Jan",
  lastName: "Kowalski",
  email: "jan@example.com",
  birthDate: null,
  role: "USER" as const,
};

function LoginButton() {
  const { login } = useAuth();
  return (
    <button onClick={() => login({ email: "jan@example.com", password: "haslo123" })}>
      zaloguj
    </button>
  );
}

function renderGuardedApp(route: string) {
  return renderWithProviders(
    <>
      <LoginButton />
      <Link to="/kalendarz">otwórz kalendarz</Link>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/kalendarz" element={<h1>Kalendarz</h1>} />
        </Route>
        <Route path="/login" element={<h1>Logowanie</h1>} />
        <Route path="/" element={<h1>Start</h1>} />
      </Routes>
    </>,
    { route }
  );
}

describe("PrivateRoute", () => {
  afterEach(() => jest.restoreAllMocks());

  test("niezalogowanego przekierowuje na /login", () => {
    renderGuardedApp("/kalendarz");

    expect(screen.getByRole("heading", { name: "Logowanie" })).toBeInTheDocument();
    // chroniona treść nie może się wyrenderować nawet na moment
    expect(screen.queryByRole("heading", { name: "Kalendarz" })).not.toBeInTheDocument();
  });

  test("zalogowanemu pokazuje chronioną treść", async () => {
    mockFetch({ status: 200, body: sampleLoginResponse }, { status: 200, body: sampleProfile });
    renderGuardedApp("/");

    await userEvent.click(screen.getByRole("button", { name: "zaloguj" }));
    await userEvent.click(screen.getByRole("link", { name: "otwórz kalendarz" }));

    expect(await screen.findByRole("heading", { name: "Kalendarz" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Logowanie" })).not.toBeInTheDocument();
  });
});