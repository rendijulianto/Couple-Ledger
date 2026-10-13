CREATE TABLE "transaction_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"action_type" varchar(20) NOT NULL,
	"payload" jsonb,
	"previous_snapshot" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"reviewer_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transaction_approvals" ADD CONSTRAINT "transaction_approvals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_approvals" ADD CONSTRAINT "transaction_approvals_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_approvals" ADD CONSTRAINT "transaction_approvals_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_approvals" ADD CONSTRAINT "transaction_approvals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approvals_workspace_status_idx" ON "transaction_approvals" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "approvals_tx_idx" ON "transaction_approvals" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "approvals_requester_idx" ON "transaction_approvals" USING btree ("requester_id");