import { z } from 'zod';
/**
 * Registers profile management tools with the MCP server
 * @param server MCP server instance
 * @param configService Configuration service
 */
export function registerProfileTools(server, configService) {
    // List profiles
    server.tool("list-profiles", {}, async (_, extra) => {
        const profiles = configService.getProfiles();
        const activeProfileId = configService.getActiveProfileId();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        profiles: profiles.map(profile => ({
                            ...profile,
                            isActive: profile.id === activeProfileId
                        })),
                        activeProfileId
                    }, null, 2)
                }
            ]
        };
    });
    // Get profile details
    server.tool("get-profile", {
        profileId: z.string().describe("Profile ID to retrieve")
    }, async ({ profileId }, extra) => {
        const profile = configService.getProfile(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }
        const activeProfileId = configService.getActiveProfileId();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        ...profile,
                        isActive: profile.id === activeProfileId
                    }, null, 2)
                }
            ]
        };
    });
    // Create profile
    server.tool("create-profile", {
        name: z.string().describe("Name of the profile"),
        description: z.string().optional().describe("Description of the profile")
    }, async ({ name, description }, extra) => {
        if (!name.trim()) {
            throw new Error("Profile name cannot be empty");
        }
        const profile = await configService.createProfile(name, description);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        profile
                    }, null, 2)
                }
            ]
        };
    });
    // Update profile
    server.tool("update-profile", {
        profileId: z.string().describe("Profile ID to update"),
        name: z.string().optional().describe("New name for the profile"),
        description: z.string().optional().describe("New description for the profile")
    }, async ({ profileId, name, description }, extra) => {
        if (!profileId.trim()) {
            throw new Error("Profile ID cannot be empty");
        }
        if (name !== undefined && !name.trim()) {
            throw new Error("Profile name cannot be empty");
        }
        const updates = {};
        if (name !== undefined) {
            updates.name = name;
        }
        if (description !== undefined) {
            updates.description = description;
        }
        const profile = await configService.updateProfile(profileId, updates);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        profile
                    }, null, 2)
                }
            ]
        };
    });
    // Delete profile
    server.tool("delete-profile", {
        profileId: z.string().describe("Profile ID to delete"),
        force: z.boolean().optional().describe("Force deletion even if active")
    }, async ({ profileId, force = false }, extra) => {
        if (!profileId.trim()) {
            throw new Error("Profile ID cannot be empty");
        }
        const activeProfileId = configService.getActiveProfileId();
        if (profileId === activeProfileId && !force) {
            throw new Error("Cannot delete active profile. Use force=true to override.");
        }
        await configService.deleteProfile(profileId);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        profileId
                    }, null, 2)
                }
            ]
        };
    });
    // Activate profile
    server.tool("activate-profile", {
        profileId: z.string().describe("Profile ID to activate")
    }, async ({ profileId }, extra) => {
        if (!profileId.trim()) {
            throw new Error("Profile ID cannot be empty");
        }
        await configService.setActiveProfile(profileId);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        profileId
                    }, null, 2)
                }
            ]
        };
    });
    // Get active profile
    server.tool("get-active-profile", {}, async (_, extra) => {
        const activeProfile = configService.getActiveProfile();
        if (!activeProfile) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            hasActiveProfile: false
                        }, null, 2)
                    }
                ]
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        hasActiveProfile: true,
                        profile: activeProfile
                    }, null, 2)
                }
            ]
        };
    });
}
//# sourceMappingURL=profile-tools.js.map