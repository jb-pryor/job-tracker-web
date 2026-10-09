import { useEffect, useState } from "react";
import EditApplication from "./EditApplications";

const API_URL = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;
const STATUSES = ["saved", "applied", "interviewing", "offer", "rejected"];

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
  // Track the filter, page position, and a revision used to request fresh data.
  const [query, setQuery] = useState({
    status: "",
    offset: 0,
    revision: 0,
  });

  const [loaded, setLoaded] = useState<{
    key: string;
    data: ApplicationList | null;
    error: string;
  } | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [editing, setEditing] = useState<Application | null>(null);

  const { status, offset, revision } = query;
  const requestKey = JSON.stringify([token, status, offset, revision]);

  // Only display results that belong to the current request.
  const loading = loaded?.key !== requestKey;
  const result = loading ? null : loaded?.data;
  const error = loading ? "" : loaded?.error;
  const busy =
    loading ||
    deletingId !== null ||
    updatingId !== null ||
    editing !== null;

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });

      if (status) {
        params.set("status", status);
      }

      try {
        const response = await fetch(
          `${API_URL}/applications?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
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
          setLoaded({ key: requestKey, data, error: "" });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoaded({
            key: requestKey,
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Could not load applications.",
          });
        }
      }
    }

    void loadApplications();

    // Cancel the old request when the query changes or the component unmounts.
    return () => controller.abort();
  }, [token, status, offset, requestKey]);

  // Return to the first page and refetch after a successful change.
  function refreshList() {
    setQuery((current) => ({
      ...current,
      offset: 0,
      revision: current.revision + 1,
    }));
  }

  async function deleteApplication(application: Application) {
    if (
      !window.confirm(
        `Delete the ${application.job_title} application at ${application.company}?`,
      )
    ) {
      return;
    }

    setDeletingId(application.id);
    setActionError("");

    try {
      const response = await fetch(
        `${API_URL}/applications/${application.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your session has expired. Log out and log in again."
            : `Could not delete application (${response.status}).`,
        );
      }

      // Successful deletion has an empty response body, so no JSON is needed.
      refreshList();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Deletion failed.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function updateStatus(applicationId: number, nextStatus: string) {
    setUpdatingId(applicationId);
    setActionError("");

    try {
      // PATCH changes only the status; other application fields stay intact.
      const response = await fetch(
        `${API_URL}/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your session has expired. Log out and log in again."
            : `Could not update application (${response.status}).`,
        );
      }

      refreshList();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Update failed.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section>
      <h2>Your applications</h2>

      {/* Mount a fresh edit form for the selected application. */}
      {editing && (
        <EditApplication
          key={editing.id}
          token={token}
          application={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refreshList();
          }}
        />
      )}

      <label htmlFor="status-filter">Filter by status </label>
      <select
        id="status-filter"
        value={status}
        disabled={
          deletingId !== null || updatingId !== null || editing !== null
        }
        onChange={(event) => {
          setActionError("");
          // Start at the first page whenever the filter changes.
          setQuery((current) => ({
            ...current,
            status: event.target.value,
            offset: 0,
          }));
        }}
      >
        <option value="">All statuses</option>
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      {actionError && <p role="alert">{actionError}</p>}
      {loading && <p role="status">Loading applications...</p>}

      {error && (
        <div>
          <p role="alert">{error}</p>
          <button onClick={refreshList}>Retry</button>
        </div>
      )}

      {result && (
        <>
          <p>
            Showing {result.items.length === 0 ? 0 : offset + 1}
            –{offset + result.items.length} of {result.total} applications
          </p>

          {result.items.length === 0 ? (
            <p>No applications match this view.</p>
          ) : (
            <div className="table-scroll">
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
                      <td>
                        <select
                          aria-label={`Status for ${application.job_title} at ${application.company}`}
                          value={application.status}
                          disabled={busy}
                          onChange={(event) =>
                            updateStatus(application.id, event.target.value)
                          }
                        >
                          {STATUSES.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>

                        {updatingId === application.id && (
                          <span role="status"> Saving...</span>
                        )}
                      </td>
                      <td>{application.applied_on ?? "—"}</td>
                      <td>
                        <button
                          disabled={busy}
                          onClick={() => {
                            setActionError("");
                            setEditing(application);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => deleteApplication(application)}
                        >
                          {deletingId === application.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Move through results by changing how many records the API skips. */}
          <nav aria-label="Application pages">
            <button
              disabled={busy || offset === 0}
              onClick={() =>
                setQuery((current) => ({
                  ...current,
                  offset: Math.max(0, current.offset - PAGE_SIZE),
                }))
              }
            >
              Previous
            </button>

            <button
              disabled={busy || offset + PAGE_SIZE >= result.total}
              onClick={() =>
                setQuery((current) => ({
                  ...current,
                  offset: current.offset + PAGE_SIZE,
                }))
              }
            >
              Next
            </button>
          </nav>
        </>
      )}
    </section>
  );
}