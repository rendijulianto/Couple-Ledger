import { Type, type Static } from "@sinclair/typebox";

export const CreateWorkspaceInputSchema = Type.Object({
  name: Type.String({ minLength: 2, maxLength: 100 }),
});

export type CreateWorkspaceInput = Static<typeof CreateWorkspaceInputSchema>;

export const JoinWorkspaceInputSchema = Type.Object({
  inviteCode: Type.String({ minLength: 4, maxLength: 32 }),
});

export type JoinWorkspaceInput = Static<typeof JoinWorkspaceInputSchema>;

export const WorkspaceMemberResponseSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  name: Type.String(),
  email: Type.String(),
  role: Type.String(),
  joinedAt: Type.String(),
});

export const WorkspaceResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  inviteCode: Type.String(),
  datePolicy: Type.Union([
    Type.Literal("STRICT_TODAY"),
    Type.Literal("FLEXIBLE"),
  ]),
  theme: Type.Optional(Type.String()),
  role: Type.String(),
  createdAt: Type.String(),
  members: Type.Array(WorkspaceMemberResponseSchema),
});

export type WorkspaceResponse = Static<typeof WorkspaceResponseSchema>;

export const UpdateWorkspaceThemeInputSchema = Type.Object({
  theme: Type.String({ minLength: 2, maxLength: 32 }),
});

export type UpdateWorkspaceThemeInput = Static<
  typeof UpdateWorkspaceThemeInputSchema
>;

export const UpdateWorkspaceDatePolicyInputSchema = Type.Object({
  datePolicy: Type.Union([
    Type.Literal("STRICT_TODAY"),
    Type.Literal("FLEXIBLE"),
  ]),
});

export type UpdateWorkspaceDatePolicyInput = Static<
  typeof UpdateWorkspaceDatePolicyInputSchema
>;

export const ReviewPolicyApprovalInputSchema = Type.Object({
  action: Type.Union([Type.Literal("APPROVE"), Type.Literal("REJECT")]),
});

export type ReviewPolicyApprovalInput = Static<
  typeof ReviewPolicyApprovalInputSchema
>;

export const WorkspaceApprovalResponseSchema = Type.Object({
  id: Type.String(),
  workspaceId: Type.String(),
  requesterId: Type.String(),
  requesterName: Type.String(),
  policyType: Type.String(),
  targetValue: Type.String(),
  currentValue: Type.String(),
  status: Type.String(),
  createdAt: Type.String(),
});

export type WorkspaceApprovalResponse = Static<
  typeof WorkspaceApprovalResponseSchema
>;

