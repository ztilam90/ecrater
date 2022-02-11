import { Link, Navigate } from "react-router-dom";
import { userSession } from "../../context/UserContext";
import React from "react";

export function Exception404() {
    return <div>

        {!userSession.id ? <Navigate to="/login"></Navigate> : <>
            <Link to="/ecrater">Ecrater</Link>
        </>}
    </div>
}