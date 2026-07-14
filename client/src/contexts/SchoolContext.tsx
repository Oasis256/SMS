import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SCHOOLS, ALL_SCHOOLS_ID } from "@shared/const";
import { useAuth } from "@/_core/hooks/useAuth";

type SchoolContextType = {
  selectedSchoolId: number; // 0 = all schools, 1-3 = specific school
  setSelectedSchoolId: (id: number) => void;
  selectedSchool: typeof SCHOOLS[number] | null;
  schools: typeof SCHOOLS;
  isAllSchools: boolean;
  canViewAllSchools: boolean;
};

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const SCHOOL_STORAGE_KEY = "selected_school_id";

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  // Only admin, principal, and bursar can view all schools
  const canViewAllSchools = !loading && (user?.role === 'admin' || user?.role === 'principal' || user?.role === 'bursar');

  const [selectedSchoolId, setSelectedSchoolIdState] = useState<number>(() => {
    const saved = localStorage.getItem(SCHOOL_STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed === ALL_SCHOOLS_ID || SCHOOLS.some(s => s.id === parsed)) {
        return parsed;
      }
    }
    return ALL_SCHOOLS_ID;
  });

  // If user cannot view all schools, force them to a specific school
  useEffect(() => {
    if (loading) return; // Wait until auth is loaded
    if (!canViewAllSchools && selectedSchoolId === ALL_SCHOOLS_ID && user) {
      // Default to first school if they don't have cross-school permission
      setSelectedSchoolIdState(SCHOOLS[0].id);
      localStorage.setItem(SCHOOL_STORAGE_KEY, SCHOOLS[0].id.toString());
    }
  }, [canViewAllSchools, selectedSchoolId, loading, user]);

  const setSelectedSchoolId = (id: number) => {
    // Prevent non-admin/non-principal from selecting All Schools
    if (id === ALL_SCHOOLS_ID && !canViewAllSchools) return;
    setSelectedSchoolIdState(id);
    localStorage.setItem(SCHOOL_STORAGE_KEY, id.toString());
  };

  const selectedSchool = selectedSchoolId === ALL_SCHOOLS_ID
    ? null
    : SCHOOLS.find(s => s.id === selectedSchoolId) || null;

  const isAllSchools = selectedSchoolId === ALL_SCHOOLS_ID;

  return (
    <SchoolContext.Provider value={{
      selectedSchoolId,
      setSelectedSchoolId,
      selectedSchool,
      schools: SCHOOLS,
      isAllSchools,
      canViewAllSchools,
    }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error("useSchool must be used within a SchoolProvider");
  }
  return context;
}
