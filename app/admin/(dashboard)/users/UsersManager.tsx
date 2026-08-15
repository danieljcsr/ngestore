"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

type ModalState = { mode: "create" } | { mode: "edit"; user: AdminUserRow } | null;

export function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUserRow[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [modal, setModal] = useState<ModalState>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  async function handleDelete(user: AdminUserRow) {
    if (!window.confirm(`Hapus akun "${user.name}" (${user.email})?`)) return;

    setListError(null);
    setDeletingId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setListError(result?.error ?? "Gagal menghapus pengguna.");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      router.refresh();
    } catch {
      setListError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved(user: AdminUserRow, mode: "create" | "edit") {
    setUsers((prev) =>
      mode === "create" ? [...prev, user] : prev.map((u) => (u.id === user.id ? user : u)),
    );
    setModal(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModal({ mode: "create" })}>+ Tambahkan Pengguna</Button>
      </div>

      {listError && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {listError}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Peran</th>
                <th className="px-4 py-3 font-semibold text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/60 last:border-b-0">
                  <td className="px-4 py-3 text-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-foreground">
                    {user.name}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-xs text-muted">(Anda)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{user.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setModal({ mode: "edit", user })}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={deletingId === user.id || users.length <= 1}
                        onClick={() => handleDelete(user)}
                      >
                        {deletingId === user.id ? "Menghapus..." : "Hapus"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Belum ada pengguna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <UserFormModal
          state={modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function UserFormModal({
  state,
  onClose,
  onSaved,
}: {
  state: { mode: "create" } | { mode: "edit"; user: AdminUserRow };
  onClose: () => void;
  onSaved: (user: AdminUserRow, mode: "create" | "edit") => void;
}) {
  const isEdit = state.mode === "edit";
  const [email, setEmail] = useState(isEdit ? state.user.email : "");
  const [name, setName] = useState(isEdit ? state.user.name : "");
  const [role, setRole] = useState(isEdit ? state.user.role : "Administrator");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const trimmedPassword = password.trim();
    if (!isEdit && trimmedPassword.length === 0) {
      setError("Password wajib diisi.");
      setSaving(false);
      return;
    }
    if (trimmedPassword.length > 0 && trimmedPassword.length < 8) {
      setError("Password minimal 8 karakter.");
      setSaving(false);
      return;
    }

    try {
      const url = isEdit ? `/api/admin/users/${state.user.id}` : "/api/admin/users";
      const method = isEdit ? "PATCH" : "POST";
      const body: Record<string, string> = { email: email.trim(), name: name.trim(), role: role.trim() };
      if (trimmedPassword.length > 0) body.password = trimmedPassword;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "Gagal menyimpan pengguna.");
        setSaving(false);
        return;
      }

      onSaved(result, isEdit ? "edit" : "create");
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-foreground">
          {isEdit ? "Edit Pengguna" : "Tambahkan Pengguna"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Nama</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="role">Peran</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">
              Password {isEdit && <span className="text-muted">(kosongkan jika tidak diubah)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "••••••••" : "Minimal 8 karakter"}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
