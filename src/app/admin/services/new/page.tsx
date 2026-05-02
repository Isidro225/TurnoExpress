import { ServiceForm } from "../ServiceForm";
import { createService } from "../actions";

export default function NewServicePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Nuevo servicio</h1>
      <ServiceForm action={createService} submitLabel="Crear" />
    </div>
  );
}
