import { useState } from "react";
import { downloadRepairPDF } from "../api/repairRequestApi";

const statusColors = {
  Pending: "bg-yellow-200 text-yellow-800",
  Approved: "bg-green-200 text-green-800",
  Rejected: "bg-red-200 text-red-800",
  "Estimate Sent": "bg-blue-200 text-blue-800",
  "Customer Approved": "bg-green-300 text-green-900",
  "Customer Rejected": "bg-red-300 text-red-900",
};

const RepairRequestCard = ({
  request,
  onUpdate,
  onDelete,
  onDecision, // optional: approve/reject estimate
  showDecisionButtons = false,
  notify, // optional notification function
}) => {
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleDownload = async () => {
    setLoadingDownload(true);
    try {
      const res = await downloadRepairPDF(request._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `repair_report_${request._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      notify?.("PDF downloaded successfully!", "success");
    } catch {
      alert("Error downloading PDF");
      notify?.("Error downloading PDF", "error");
    } finally {
      setLoadingDownload(false);
    }
  };

  const handleUpdateClick = async () => {
    setLoadingUpdate(true);
    try {
      await onUpdate(request);
      notify?.("Request updated successfully!", "success");
    } catch {
      notify?.("Error updating request", "error");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    setLoadingDelete(true);
    try {
      await onDelete(request._id);
      notify?.("Request deleted successfully!", "success");
    } catch {
      notify?.("Error deleting request", "error");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="bg-lightBg p-4 rounded-xl shadow mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold text-primary">{request.damageType}</h3>
        <span className={`px-2 py-1 rounded text-sm ${statusColors[request.status] || "bg-gray-200 text-gray-800"}`}>
          {request.status}
        </span>
      </div>
      <p><strong>Description:</strong> {request.description}</p>
      <p><strong>Progress:</strong> {request.repairProgress || 0}%</p>
      <p><strong>Current Stage:</strong> {request.currentStage || "Not started"}</p>
      {request.costEstimate && <p><strong>Cost:</strong> {request.costEstimate}</p>}
      {request.timeEstimate && <p><strong>Time Estimate:</strong> {request.timeEstimate}</p>}

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={handleUpdateClick}
          className="bg-secondaryBtn text-white py-1 px-3 rounded hover:bg-secondaryBtnHover flex items-center gap-1"
          disabled={loadingUpdate}
        >
          {loadingUpdate ? "Updating..." : "Update"}
        </button>

        <button
          onClick={handleDeleteClick}
          className="bg-primary text-white py-1 px-3 rounded hover:bg-primaryHover flex items-center gap-1"
          disabled={loadingDelete}
        >
          {loadingDelete ? "Deleting..." : "Delete"}
        </button>

        <button
          onClick={handleDownload}
          className="bg-secondary text-white py-1 px-3 rounded hover:bg-primaryHover flex items-center gap-2"
          disabled={loadingDownload}
        >
          {loadingDownload && (
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          )}
          {loadingDownload ? "Downloading..." : "Download PDF"}
        </button>

        {/* Optional Accept/Reject buttons */}
        {showDecisionButtons && onDecision && request.status === "Estimate Sent" && (
          <>
            <button
              onClick={() => onDecision(request._id, "approve")}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Accept Estimate
            </button>
            <button
              onClick={() => onDecision(request._id, "reject")}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reject Estimate
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RepairRequestCard;
