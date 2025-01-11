"use server";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Use Zod to update the expected types
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["paid", "pending"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
//CREATE INVOICE ACTION
export async function createInvoice(prevState: State, formData: FormData) {
  //   const rawFormData = {
  //     customerId: formData.get('customerId'),
  //     amount: formData.get('amount'),
  //     status: formData.get('status'),
  //   };
  // Test it out:
  //   console.log(typeof rawFormData.amount);
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }
  //Prepare data for database insertion
  const { customerId, amount, status } = validatedFields.data;
  const amountInCent = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  //   await sql`
  //         INSERT INTO invoices (customer_id, amount, status, date)
  //         VALUES (${customerId}, ${amountInCent}, ${status}, ${date})`;

  try {
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCent}, ${status}, ${date})`;
  } catch (error) {
    return {
      message: "Database error: Failed to create Invoice",
    };
  }
  // Revalidate the invoices page
  revalidatePath("/dashboard/invoices");
  // Redirect to the invoices page
  redirect("/dashboard/invoices");
}

//EDIT INVOICE ACTION
export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  // const { customerId, amount, status } = UpdateInvoice.parse({
  //   customerId: formData.get("customerId"),
  //   amount: formData.get("amount"),
  //   status: formData.get("status"),
  // });
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  const amountInCent = amount * 100;
  //   await sql`
  //     UPDATE invoices
  //     SET customer_id = ${customerId},
  //         amount = ${amountInCent},
  //         status = ${status}
  //     WHERE id = ${id}`;
  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId},
        amount = ${amountInCent},
        status = ${status}
    WHERE id = ${id}`;
  } catch (error) {
    return {
      message: "Database error: Failed to update Invoice",
    };
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

//DELETE INVOICE ACTION
export async function deleteInvoice(id: string) {
  // throw new Error('Failed to Delete Invoice');
  // try {
  //   await sql`
  //       DELETE FROM invoices
  //       WHERE id = ${id}`;
  //       revalidatePath("/dashboard/invoices");
  //       return {
  //           message: "Invoice deleted successfully",
  //       }
  // } catch (error) {
  //   return {
  //     message: "Database error: Failed to delete Invoice",
  //   };
  // }
  await sql`
        DELETE FROM invoices
        WHERE id = ${id}`;
  revalidatePath("/dashboard/invoices");
}
