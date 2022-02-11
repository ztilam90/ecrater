import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ContextProvider } from "./context/AllContext";
import { UserContext } from "./context/UserContext";
import { Ecrater } from "./pages/Ecrator/Ecrater";
import { Exception404 } from "./pages/exception/404";
import { Login } from "./pages/Login";
import './scss/App.scss';

export function App() {
    return <>
        <BrowserRouter window={window}>
            <ContextProvider>
                <UserContext.Consumer>
                    {() =>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/ecrater/*" element={<Ecrater />} />
                            <Route path="*" element={<Exception404 />} />
                        </Routes>
                    }
                </UserContext.Consumer>
            </ContextProvider>
        </BrowserRouter>
    </>
}