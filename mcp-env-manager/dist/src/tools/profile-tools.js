import { z } from 'zod';
/**
 * Registers profile management tools with the MCP server
 * @param server MCP server instance
 * @param configService Configuration service
 */
export function registerProfileTools(server, configService) {
    // List profiles
    server.tool("list-profiles", {}, async () => {
        const profiles = configService.getProfiles();
        const activeProfileId = configService.getActiveProfileId();
        return {
            profiles: profiles.map(profile => ({
                ...profile,
                isActive: profile.id === activeProfileId
            })),
            activeProfileId
        };
    });
    // Get profile details
    server.tool("get-profile", {
        profileId: z.string().describe("Profile ID to retrieve")
    }, async ({ profileId }) => {
        const profile = configService.getProfile(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }
        const activeProfileId = configService.getActiveProfileId();
        return {
            ...profile,
            isActive: profile.id === activeProfileId
        };
    });
    // Create profile
    server.tool("create-profile", {
        name: z.string().describe("Name of the profile"),
        description: z.string().optional().describe("Description of the profile")
    }, async ({ name, description }) => {
        if (!name.trim()) {
            throw new Error("Profile name cannot be empty");
        }
        const profile = await configService.createProfile(name, description);
        return {
            success: true,
            profile
        };
    });
    // Update profile
    server.tool("update-profile", {
        profileId: z.string().describe("Profile ID to update"),
        name: z.string().optional().describe("New name for the profile"),
        description: z.string().optional().describe("New description for the profile")
    }, async ({ profileId, name, description }) => {
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
            success: true,
            profile
        };
    });
    // Delete profile
    server.tool("delete-profile", {
        profileId: z.string().describe("Profile ID to delete"),
        force: z.boolean().optional().describe("Force deletion even if active")
    }, async ({ profileId, force = false }) => {
        if (!profileId.trim()) {
            throw new Error("Profile ID cannot be empty");
        }
        const activeProfileId = configService.getActiveProfileId();
        if (profileId === activeProfileId && !force) {
            throw new Error("Cannot delete active profile. Use force=true to override.");
        }
        await configService.deleteProfile(profileId);
        return {
            success: true,
            profileId
        };
    });
    // Activate profile
    server.tool("activate-profile", {
        profileId: z.string().describe("Profile ID to activate")
    }, async ({ profileId }) => {
        if (!profileId.trim()) {
            throw new Error("Profile ID cannot be empty");
        }
        await configService.setActiveProfile(profileId);
        return {
            success: true,
            profileId
        };
    });
    // Get active profile
    server.tool("get-active-profile", {}, async () => {
        const activeProfile = configService.getActiveProfile();
        if (!activeProfile) {
            return {
                hasActiveProfile: false
            };
        }
        return {
            hasActiveProfile: true,
            profile: activeProfile
        };
    });
}
//# sourceMappingURL=profile-tools.js.map