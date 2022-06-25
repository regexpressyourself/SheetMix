import type { ActionFunction, LinksFunction, LoaderFunction } from "remix";
import { useRef } from "react";
import entryStylesUrl from "~/styles/entry.css";
import {
  redirect,
  Form,
  json,
  useActionData,
  useLoaderData,
  useTransition,
} from "remix";
import { requireUserId, getUser } from "~/utils/session.server";
import {
  putSheetData,
  getSheetDataGoogle,
  getSheetMetadata,
} from "~/utils/google.server";
import stylesUrl from "~/styles/app.css";
const DEFAULT_RANGE = "A:Z";
const DEFAULT_SHEET = "Sheet1";

export const links: LinksFunction = () => {
  return [
    { prefetch: "intent", rel: "stylesheet", href: stylesUrl },
    {
      rel: "stylesheet",
      href: entryStylesUrl,
    },
  ];
};

type LoaderData = {
  spreadsheetId: string;
  user: Awaited<ReturnType<typeof getUser>>;
  sheetMetadata?: any;
  sheetData?: any;
};

export type ActionData = {
  formError?: string;
  fieldErrors?: {
    value: string | undefined;
    sheet: string | undefined;
    range: string | undefined;
  };
  fields?: {
    value: string;
    sheet: string;
    range: string;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();

  const value = form.get("value");
  const sheet = form.get("sheet");
  const range = form.get("range");
  if (
    typeof value !== "string" ||
    typeof sheet !== "string" ||
    typeof range !== "string"
  ) {
    console.error("Form not submitted correctly.");
    return badRequest({
      formError: `form not submitted correctly.`,
    });
  }

  const fields = {
    value,
    sheet,
    range,
  };
  const fieldErrors = {
    value: typeof value !== "string" ? "Value incorrect" : undefined,
    range: typeof range !== "string" ? "Range incorrect" : undefined,
    sheet: typeof sheet !== "string" ? "Sheet incorrect" : undefined,
  };
  if (Object.values(fieldErrors).some(Boolean) && fields) {
    return badRequest({ fieldErrors, fields });
  }

  await putSheetData(request, `${sheet}!${range}`, [[value]]);
  const redirectUrl = new URL(request.url);

  redirectUrl.searchParams.append("sheet", sheet);
  redirectUrl.searchParams.append("range", range);

  return redirect(redirectUrl.href);
};

export const loader: LoaderFunction = async ({
  request,
}: {
  request: Request;
}) => {
  await requireUserId(request);
  const user = await getUser(request);
  if (!user?.spreadsheetId) {
    return redirect("/connect");
  }

  const query = new URLSearchParams(new URL(request.url).search);
  const range = query.get("range") || DEFAULT_RANGE;
  const sheet = query.get("sheet") || DEFAULT_SHEET;
  const sheetData = await getSheetDataGoogle(request, `${sheet}!${range}`);
  const sheetMetadata = await getSheetMetadata(request);
  const data: LoaderData = {
    spreadsheetId: user.spreadsheetId,
    user,
    sheetMetadata,
    sheetData,
  };
  return data;
};

export default function Entry() {
  let formRef = useRef<HTMLFormElement>(null);
  let valueRef = useRef<HTMLInputElement>(null);
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  const spreadsheetId = loaderData?.spreadsheetId;
  const sheetData = loaderData?.sheetData;
  const sheetMetadata = loaderData?.sheetMetadata;

  return (
    <main className="app-main">
      <Form
        ref={formRef}
        method="post"
        action={`/entry`}
        aria-describedby={
          actionData?.formError ? "form-error-message" : undefined
        }
      >
        <div>
          <label htmlFor="sheet">
            <input
              type="text"
              required
              id="sheet-input"
              name="sheet"
              defaultValue={DEFAULT_SHEET}
              aria-invalid={Boolean(
                sheetData.error || actionData?.fieldErrors?.sheet
              )}
              aria-describedby={
                actionData?.fieldErrors?.sheet ? "sheet-error" : undefined
              }
            />
            Sheet
          </label>
          <label htmlFor="range">
            <input
              type="text"
              required
              id="range-input"
              name="range"
              defaultValue={DEFAULT_RANGE}
              aria-invalid={Boolean(
                sheetData.error || actionData?.fieldErrors?.range
              )}
              aria-describedby={
                actionData?.fieldErrors?.range ? "range-error" : undefined
              }
            />
            Range
          </label>
        </div>
        <label htmlFor="value">
          <input
            ref={valueRef}
            type="text"
            required
            id="value-input"
            name="value"
            defaultValue={0}
            aria-invalid={Boolean(actionData?.fieldErrors?.value)}
            aria-describedby={
              actionData?.fieldErrors?.value ? "value-error" : undefined
            }
          />
          {actionData?.fieldErrors?.value ? (
            <p className="form-validation-error" role="alert" id="value-error">
              {actionData?.fieldErrors.value}
            </p>
          ) : null}
          Value
        </label>

        <button
          type="submit"
          disabled={transition.state === "submitting"}
          className="button "
        >
          {transition.state === "submitting" ? "Submiting..." : "Submit"}{" "}
        </button>
      </Form>
      <p>
        <strong>spreadsheetId:</strong>
        <br />
        <code>{JSON.stringify(spreadsheetId)}</code>
      </p>
      <p>
        <strong>sheetData:</strong>
        <br />
        <code>
          {sheetData.error
            ? JSON.stringify(sheetData.error?.errors)
            : JSON.stringify(sheetData)}
        </code>
      </p>
      <p>
        <strong>sheetMetadata:</strong>
        <br />
        <code>{JSON.stringify(sheetMetadata)}</code>
      </p>
    </main>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <>
      <div className="error-container">
        <h1>Error uploading data</h1>
        <pre>{error.message}</pre>
      </div>
      <a href="/entry">Back to entry page</a>
    </>
  );
}
