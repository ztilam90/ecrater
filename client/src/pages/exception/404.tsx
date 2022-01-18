import { Navigate } from "react-router-dom";
import { userSession } from "../../context/UserContext";
import React from "react";

export function Exception404() {
    return <div>
        Not found this page
        {!userSession.id && <Navigate to="/login"></Navigate>}
    </div>
} 