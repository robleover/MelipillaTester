import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId || session.user.role !== "ADMIN") return null;

  const members = await prisma.user.findMany({
    where: { teamId: session.user.teamId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const invitations = await prisma.invitation.findMany({
    where: { teamId: session.user.teamId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const seasons = await prisma.season.findMany({
    where: { teamId: session.user.teamId },
    orderBy: { createdAt: "desc" },
  });

  const team = await prisma.team.findUnique({
    where: { id: session.user.teamId },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">⚙️ Panel de Administración</h1>
        <p className="text-gray-500 mt-1">
          Gestiona el equipo, invita miembros, y administra temporadas.
        </p>
      </div>
      <AdminClient
        members={JSON.parse(JSON.stringify(members))}
        invitations={JSON.parse(JSON.stringify(invitations))}
        seasons={JSON.parse(JSON.stringify(seasons))}
        team={JSON.parse(JSON.stringify(team))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
