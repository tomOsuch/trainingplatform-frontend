import { getProfile } from "../services/profileApi";

function CalendarPage() {
  return (
    <div>
      <h1>Kalendarz — wkrótce</h1>
      {/* TYMCZASOWE — do testu 401, usunąć po Tasku 9 */}
      <button onClick={() => getProfile().then(console.log).catch(console.error)}>
        Test: pobierz profil
      </button>
    </div>
  );
}

export default CalendarPage;