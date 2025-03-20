import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";



export const GET = async () => {     // Desde StudioHeader.tsx si se pincha en el avatar del usuario, se redirige a /users/current
  
  const { userId } = await auth();   // Obtiene el id de usuario autenticado

  if(!userId){
    return redirect("/sign-in");
  }

  const [existingUser] = await db    // Verifica si el usuario existe en la base de datos
    .select()
    .from(users)
    .where(
      eq(users.clerkId, userId)
    )

  if(!existingUser){
    return redirect("/sign-up");
  }

  return redirect(`/users/${existingUser.id}`); // Redirige al usuario actual a la ruta de su perfil
}