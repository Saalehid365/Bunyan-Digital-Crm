import { z } from "zod";

export const roleEnum = z.enum(["ADMIN", "MEMBER"]);

export const inviteUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  role: roleEnum.default("MEMBER"),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
