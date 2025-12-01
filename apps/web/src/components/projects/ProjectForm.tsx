import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Project } from "@/types";
import { useEffect } from "react";
import { useClients } from "@/hooks/useClients";
import { useUsers } from "@/hooks/useUsers";
import { MultiSelect } from "@/components/ui/multi-select";
import { User as UserIcon } from "lucide-react";

const projectSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    clientId: z.string().optional(),
    ownerId: z.string().optional(),
    memberIds: z.array(z.string()).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
    initialData?: Project & { members?: { id: string }[] };
    onSubmit: (data: ProjectFormValues) => void;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function ProjectForm({ initialData, onSubmit, isLoading, onCancel }: ProjectFormProps) {
    const { data: clientsData } = useClients({ limit: 100 });
    const { data: users } = useUsers();

    const clients = Array.isArray(clientsData) ? clientsData : (clientsData as any)?.data || [];

    // Filter users for Team Members (Operators and Developers)
    const teamMemberOptions = users
        ?.filter((user: any) => {
            const roleName = user.role?.name?.toUpperCase()?.trim();
            return ['DEVELOPER', 'OPERARIO'].includes(roleName);
        })
        .map((user: any) => ({
            label: `${user.firstName} ${user.lastName} (${user.role?.name})`,
            value: user.id,
            icon: UserIcon,
        })) || [];

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            status: (initialData?.status as any) || "ACTIVE",
            startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
            clientId: initialData?.clientId || "",
            ownerId: initialData?.ownerId || "",
            memberIds: initialData?.members?.map(m => m.id) || [],
        },
    });

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                description: initialData.description || "",
                status: (initialData.status as any),
                startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
                endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
                clientId: initialData.clientId || "",
                ownerId: initialData.ownerId || "",
                memberIds: initialData.members?.map(m => m.id) || [],
            });
        }
    }, [initialData, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {
                // Clean empty strings to undefined for API
                const cleanedData = {
                    ...data,
                    endDate: data.endDate === "" ? undefined : data.endDate,
                    clientId: data.clientId === "" ? undefined : data.clientId,
                    ownerId: data.ownerId === "" ? undefined : data.ownerId,
                };
                onSubmit(cleanedData);
            })} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter project name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Project description" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Client</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select client" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {clients?.map((client: any) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="ownerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Manager (Owner)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select manager" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {users?.map((user: any) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="memberIds"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Team Members (Operators/Developers)</FormLabel>
                            <FormControl>
                                <MultiSelect
                                    options={teamMemberOptions}
                                    selected={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Select team members..."
                                    className="w-full"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>End Date (Optional)</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : initialData ? "Update Project" : "Create Project"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
