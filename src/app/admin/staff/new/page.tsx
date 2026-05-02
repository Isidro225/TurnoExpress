import { StaffForm } from "../StaffForm";
import { createStaff } from "../actions";

export default function NewStaffPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Agregar persona</h1>
      <StaffForm action={createStaff} submitLabel="Crear" />
    </div>
  );
}
