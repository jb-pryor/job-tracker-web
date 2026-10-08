import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

type Application = {
  id: number;
  company: string;
  job_title: string;
  status: string;
  applied_on: string | null;
};

type ApplicationList = {
  items: Application[];
  total: number;
  limit: number;
  offset: number;
};

type Props = {
  token: string;
};

export default function Applications({ token }: Props) {
  const [result, setResult] = useState<ApplicationList | null>(null);
  const [error, setError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      try {
        const response = await fetch(
          `${API_URL}/applications?limit=20&offset=0`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Your session has expired. Log out and log in again."
              : `Could not load applications (${response.status}).`,
          );
        }

        const data: ApplicationList = await response.json();

        if (!controller.signal.aborted) {
          setResult(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Could not load applications.",
          );
        }
      }
    }

    void loadApplications();

    return () => controller.abort();
  }, [token]);

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!result) {
    return <p role="status">Loading applications...</p>;
  }

  async function deleteApplication(application: Application) {
    const confirmed = window.confirm(
      `Delete the ${application.job_title} application at ${application.company}?`,
    );
  
    if (!confirmed) return;
  
    setDeletingId(application.id);
    setActionError("");
  
    try {
      const response = await fetch(
        `${API_URL}/applications/${application.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
  
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your session has expired. Log out and log in again."
            : `Could not delete application (${response.status}).`,
        );
      }
  
      setResult((current) =>
        current
          ? {
              ...current,
              items: current.items.filter(
                (item) => item.id !== application.id,
              ),
              total: current.total - 1,
            }
          : current,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not delete application.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <h2>Your applications</h2>
      {actionError && <p role="alert">{actionError}</p>}
      <p>
        Showing {result.items.length} of {result.total} applications
      </p>

      {result.items.length === 0 ? (
        <p>You haven’t added any applications yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col">Job title</th>
              <th scope="col">Status</th>
              <th scope="col">Applied on</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((application) => (
              <tr key={application.id}>
                <td>{application.company}</td>
                <td>{application.job_title}</td>
                <td>{application.status}</td>
                <td>{application.applied_on ?? "—"}</td>
                <td>
                  <button
                    onClick={() => deleteApplication(application)}
                    disabled={deletingId !== null}
                  >
                    {deletingId === application.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}