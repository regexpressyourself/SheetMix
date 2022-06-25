import type { LinksFunction, ActionFunction, LoaderFunction } from "remix";
import moment from "moment";
import { db } from "~/utils/db.server";
import { Form, redirect, useActionData } from "remix";
import { requireUserId, getUser, getTokens } from "~/utils/session.server";
import { putSheetData } from "~/utils/google.server";
import stylesUrl from "~/styles/app.css";

const SPREADSHEET_ID = "13fT6U82o1VVnyBU_josXb-FDnTnFEcjo_VdJkFtvHxw";

export const links: LinksFunction = () => {
  return [{ prefetch: "intent", rel: "stylesheet", href: stylesUrl }];
};

type ActionData = {
  formError?: string;
  fieldErrors?: {
    spreadsheetId: string | undefined;
    content: string | undefined;
  };
  fields?: {
    name: string;
    content: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const spreadsheetLink = form.get("spreadsheetLink");
  if (typeof spreadsheetLink !== "string") {
    return {
      fieldErrors: {
        spreadsheetId: "You must paste the entire URL of the spreadsheet",
      },
    };
  }

  const spreadsheetLinkSplit = spreadsheetLink.split("/");
  const spreadsheetId = spreadsheetLinkSplit[5];
  if (!spreadsheetId || spreadsheetId === "") {
    return {
      fieldErrors: {
        spreadsheetId: "You must paste the entire URL of the spreadsheet",
      },
    };
  }
  if (spreadsheetId === SPREADSHEET_ID) {
    return {
      fieldErrors: {
        spreadsheetId:
          "You must duplicate the spreadsheet to your own Google Drive",
      },
    };
  }

  await db.user.update({
    where: { id: userId },
    data: { spreadsheetId },
  });
  const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const getDays = (offset: number) =>
    [...Array(104).keys()].map((id) => {
      if (id % 2 === 0) {
        return moment()
          .add(7 * Math.floor(id / 2), "d")
          .add(offset, "d")
          .subtract(7, "d")
          .format("MM/DD/YYYY");
      }
      return "";
    });

  [...Array(7).keys()].map(async (id) => {
    await putSheetData(request, `${DAYS[(new Date().getDay() + id) % 7]}!1:1`, [
      ["Sets", "Notes", "Instructions", ...getDays(id)],
    ]);
  });

  return redirect(`/entry`);
};

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
};

export const loader: LoaderFunction = async ({
  request,
}: {
  request: Request;
}) => {
  await requireUserId(request);
  const tokens = await getTokens(request);
  if (!tokens?.access_token) {
    return redirect("connect");
  }
  const user = await getUser(request);
  if (user?.spreadsheetId) {
    return redirect("entry");
  }

  const data: LoaderData = {
    user,
  };
  return data;
};

export default function Sheet() {
  const actionData = useActionData<ActionData>();

  return (
    <main className="app-main">
      <div>
        <h1>Sheet ID</h1>
        <ol>
          <li>
            <a
              href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?usp=sharing`}
              target="_blank"
            >
              Duplicate the spreadsheet here to your own Google Drive
            </a>
          </li>
          <li>Copy the URL of the duplicated spreadsheet</li>
          <li>Paste the URL below and submit the form</li>
        </ol>
        <Form method="post">
          <label htmlFor="spreadsheetLink">
            <strong>Spreadsheet Link</strong>
          </label>
          <input id="spreadsheetLink" type="text" name="spreadsheetLink" />

          {actionData?.fieldErrors?.spreadsheetId ? (
            <p className="form-validation-error" role="alert" id="reps-error">
              {actionData?.fieldErrors.spreadsheetId}
            </p>
          ) : null}

          <button type="submit" className="button">
            Add
          </button>
        </Form>
      </div>
    </main>
  );
}
