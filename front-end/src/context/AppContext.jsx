import React, { useContext, useState, useEffect, useCallback } from 'react';
import { createContext } from 'react';
import api from '../api/api'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce'
import { files } from 'jszip';

const AppContext = createContext(undefined)

export function AppContextProvider({ children }) {

    const navigate = useNavigate()

    //Auth states
    const [user, setUser] = useState(null)
    const [loadingUser, setLoadingUser] = useState(true)

    //states 
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [activeProject, setActiveProject] = useState(null);
    const [loadingActiveProject, setLoadingActiveProject] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [generatingProject, setGeneratingProject] = useState(false);
    const [activeFile, setActiveFile] = useState("/App.js");
    const [showCode, setShowCode] = useState(false);

    // Auth Actions
    const checkSession = async () => {
        try {
            const { data } = await api.get("/api/auth/me");
            setUser(data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoadingUser(false);
        }
    }
    useEffect(() => {
        checkSession()
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post("/api/auth/login", { email, password });
            setUser(data.user);
            toast.success('Welcome Back!')
            navigate("/")
        } catch (err) {
            console.error('login failed:', err);
            const errMsg = err?.response?.data?.error || 'invalid email or password';
            toast.error(errMsg);
            throw new Error(errMsg);
        }
    }

    const register = async (name, email, password) => {
        try {
            const { data } = await api.post("/api/auth/register", { name, email, password });
            setUser(data.user);
            toast.success('Account creates successfully!')
            navigate("/")
        } catch (err) {
            console.error('Registration failed:', err);
            const errMsg = err?.response?.data?.error || 'Registration failed';
            toast.error(errMsg);
            throw new Error(errMsg);
        }
    }

    const logout = async () => {
        try {
            await api.post("/api/auth/logout")
            setUser(null)
            setProjects([])
            setActiveProject(null)
            toast.success("Logged out successfully")
            navigate("/login")
        } catch (err) {
            console.error("Logout failed:", err);
            toast.error("Logout failed");
        }
    }

    //project actions
    const loadProjects = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await api.get("/api/projects")
            setProjects(data)
        } catch (err) {
            console.error("failed to list projects:", err);
            toast.error("Failed to load projects list");
        } finally {
            setLoadingProjects(false);
        }
    }, [user])

    const loadProject = useCallback(async (id, silent = false) => {
        if (!user) return;
        if (!silent) setLoadingActiveProject(true)
        try {
            const { data } = await api.get(`/api/projects/${id}`)
            const project = { ...data, _id: data._id || data.id || id };
            setActiveProject(project);

            //default file selection
            const files = Object.keys(project.files);
            if (files.length > 0) {
                setActiveFile((prev) => {
                    if (files.includes(prev)) return prev;
                    if (files.includes("/App.js")) return "/App.js";
                    return files[0]
                })
            }
        } catch (err) {
            console.error("failed to load project:", err);
            if (!silent) {
                toast.error("failed to load projects details");
                navigate("/")
            }
        } finally {
            if (!silent) setLoadingActiveProject(false)
        }
    }, [navigate, user])


    // automatically poll active projects status if generating or pending
    useEffect(() => {
        const projectId = activeProject?._id || activeProject?.id;
        if (!projectId || !user) return;

        const isOngoing = activeProject.status === "generating" || activeProject.status === "pending" || activeProject.status === "revising";

        if (isOngoing) {
            setChatLoading(true);
            const interval = setInterval(() => {
                loadProject(projectId, true)
            }, 2000);
            return () => clearInterval(interval)
        } else {
            setChatLoading(false)
        }

    }, [activeProject?._id, activeProject?.id, activeProject?.status, loadProject, user])


    const handleGenerate = useCallback(
        async (prompt) => {
            if (!user) return;

            setGeneratingProject(true);
            try {
                const { data } = await api.post("/api/projects", { prompt });
                toast.success("AI Agent is planning structure...")
                navigate(`/builder/${data._id}`);
            } catch (err) {
                console.error("failed to generate projects:", err);
                toast.error(err?.response?.data?.error || "failed to generate project");
            } finally {
                setGeneratingProject(false);
            }

        }, [navigate, user]
    )

    const handleDelete = useCallback(
        async (id) => {
            if (!user) return;

            try {
                await api.delete(`/api/projects/${id}`);
                setProjects((prev) => prev.filter((p) => p._id !== id))
                toast.success("project deleted successfully")
            } catch (err) {
                console.error("failed to delete projects:", err);
                toast.error("failed to delete project");
            }

        }, [user]
    )

    const handleChat = useCallback(
        async (prompt) => {
            if (!activeProject || !user) return;
            setChatLoading(true)
            try {
                const { data } = await api.post(`/api/projects/${activeProject._id}/chat`, { prompt });
                setActiveProject(data)
                if (data.errors && data.errors.length > 0) {
                    toast.success(`updated to version ${data.version}`);
                }
            } catch (err) {
                console.error("Revision request failed:", err);
                toast.error(err?.response?.data?.error || "Revision request failed");
            } finally {
                setChatLoading(false)
            }
        }, [activeProject, user]
    )

    const debouncedSave = React.useMemo(
        () => debounce(async (files, id) => {
            try {
                await api.put(`/api/projects/${id}/files`, { files })
            } catch (err) {
                console.log("failed to auto-save files:", err);
                toast.error("failed to save code modification");
            }
        }, 1000), [],
    )

    useEffect(() => {
        return () => {
            debouncedSave.flush();
        }
    }, [debouncedSave])

    const updateProjectFiles = useCallback(
        async (params) => {
            if (!activeProject || !user) return;
            debouncedSave(params, activeProject._id)
        }, [activeProject, user, debouncedSave]
    )

    return (
        <AppContext.Provider value={{
            user,
            loadingUser,
            login,
            register,
            projects,
            loadingProjects,
            activeProject,
            loadingActiveProject,
            chatLoading,
            generatingProject,
            activeFile,
            showCode,
            setActiveFile,
            setShowCode,
            loadProjects,
            loadProject,
            handleGenerate,
            handleDelete,
            logout,
            updateProjectFiles,
            handleChat
        }}>
            {children}
        </AppContext.Provider>
    )
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useAppContext must be used within an AppContextProvider");
    }
    return context;
}
