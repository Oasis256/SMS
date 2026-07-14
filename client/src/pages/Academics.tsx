import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { useState } from "react";
import { Plus, BookOpen, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useEffect } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { SCHOOLS } from "@shared/const";

export default function Academics() {
  const { user, isAuthenticated, loading } = useAuth();
  const { selectedSchoolId } = useSchool();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const { data: classes } = trpc.academics.classes.list.useQuery({ schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined }, { enabled: isAuthenticated });
  const { data: subjects } = trpc.academics.subjects.list.useQuery({ schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined }, { enabled: isAuthenticated });
  const { data: calendar } = trpc.academics.calendar.list.useQuery({ schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined }, { enabled: isAuthenticated });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="Academics">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Academic Management</h1>

        <Tabs defaultValue="classes">
          <TabsList>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Capacity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes?.map((cls: any) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.section || '-'}</TableCell>
                        <TableCell className="capitalize">{cls.level?.replace('_', ' ') || '-'}</TableCell>
                        <TableCell>{cls.classTeacherId || '-'}</TableCell>
                        <TableCell className="capitalize">{SCHOOLS.find((s: any) => s.id === cls.schoolId)?.shortName || '-'}</TableCell>
                        <TableCell>{cls.capacity || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {(!classes || classes.length === 0) && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No classes configured</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Subjects</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects?.map((subj: any) => (
                      <TableRow key={subj.id}>
                        <TableCell className="font-mono">{subj.code}</TableCell>
                        <TableCell className="font-medium">{subj.name}</TableCell>
                        <TableCell>{subj.department || '-'}</TableCell>
                        <TableCell className="capitalize">{subj.level || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {(!subjects || subjects.length === 0) && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No subjects configured</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Academic Calendar</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>School</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calendar?.map((event: any) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell className="capitalize">{event.eventType?.replace('_', ' ')}</TableCell>
                        <TableCell>{event.startDate ? new Date(event.startDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{event.endDate ? new Date(event.endDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="capitalize">{SCHOOLS.find((s: any) => s.id === event.schoolId)?.shortName || 'All'}</TableCell>
                      </TableRow>
                    ))}
                    {(!calendar || calendar.length === 0) && (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No calendar events</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
