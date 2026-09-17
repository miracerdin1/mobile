import { useCallback, useEffect, useState } from "react";

import Config from "../constants/Config";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { Folder, Link } from "../types";

/**
 * One-shot snapshot of folders and links for the library screen. Unlike the
 * home screen it does not subscribe to socket updates — `reload` is enough.
 */
export function useArchiveData() {
  const { isAuthenticated, token } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [foldersRes, linksRes] = await Promise.all([
        api.get<Folder[]>(`${Config.API_URL}/api/folders`),
        api.get<Link[]>(`${Config.API_URL}/api/links`),
      ]);
      setFolders(Array.isArray(foldersRes.data) ? foldersRes.data : []);
      setLinks(Array.isArray(linksRes.data) ? linksRes.data : []);
      setError(false);
    } catch (err) {
      console.warn("Fetch archive error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { folders, links, loading, error, reload };
}
