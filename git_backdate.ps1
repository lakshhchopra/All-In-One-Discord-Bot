# git_backdate.ps1
# PowerShell script to create backdated development history commits

# Helper function to create commit
function New-BackdatedCommit($date, $message, $files) {
    Write-Host "Creating commit on ${date} - ${message}"
    
    # Set Env Variables for backdating
    $env:GIT_AUTHOR_DATE = "${date}"
    $env:GIT_COMMITTER_DATE = "${date}"
    
    # Add files
    foreach ($file in $files) {
        if (Test-Path $file) {
            git add $file
        }
    }
    
    # Commit
    git commit -m "$message"
}

# 1. July 1: Initial project setup
$files1 = @(
    "package.json",
    "tsconfig.json",
    ".gitignore",
    ".prettierrc",
    "pm2.config.js",
    "Dockerfile",
    "docker-compose.yml",
    ".env.example"
)
New-BackdatedCommit "2026-07-01T12:00:00" "chore: initial project structure, configurations, docker and PM2 setup" $files1

# 2. July 2: Database architecture
$files2 = @(
    "prisma/schema.prisma",
    "src/services/db.ts"
)
New-BackdatedCommit "2026-07-02T12:00:00" "feat: setup database layer with Prisma schema and PostgreSQL configuration" $files2

# 3. July 3: Command Framework & base services
$files3 = @(
    "src/config/index.ts",
    "src/services/redis.ts",
    "src/services/jobs.ts",
    "src/constants/emojis.ts",
    "src/services/utils/parser.ts",
    "src/services/embed.ts",
    "src/commands/context.ts",
    "src/commands/permissions.ts",
    "src/commands/command.ts"
)
New-BackdatedCommit "2026-07-03T12:00:00" "feat: implement unified command execution context, permissions, redis caching, and universal embeds builder" $files3

# 4. July 4: Welcomer & Canvas system
$files4 = @(
    "src/services/canvas.ts",
    "src/modules/welcome/commands.ts"
)
New-BackdatedCommit "2026-07-04T12:00:00" "feat: implement Canvas card rendering service and Welcomer & Boost modules" $files4

# 5. July 5: Moderation, TempVC and Voicemod
$files5 = @(
    "src/modules/moderation/commands.ts",
    "src/modules/tempvc/commands.ts",
    "src/modules/voicemod/commands.ts"
)
New-BackdatedCommit "2026-07-05T12:00:00" "feat: implement Moderation, Temporary Voice channels, and Voice Moderation modules" $files5

# 6. July 6: Security, logging & trackers
$files6 = @(
    "src/modules/configuration/commands.ts",
    "src/modules/logging/commands.ts",
    "src/modules/security/commands.ts",
    "src/modules/antiraid/commands.ts",
    "src/modules/invites/commands.ts",
    "src/modules/messages/commands.ts",
    "src/events/guildMemberAdd.ts",
    "src/events/voiceStateUpdate.ts",
    "src/events/messageCreate.ts",
    "src/events/interactionCreate.ts"
)
New-BackdatedCommit "2026-07-06T12:00:00" "feat: implement Security (Antinuke/Antiraid), logging configuration, invite/message trackers and core event routers" $files6

# 7. July 7: Extras, Dashboard and final polish
$files7 = @(
    "src/modules/embeds/commands.ts",
    "src/modules/giveaway/commands.ts",
    "src/modules/games/commands.ts",
    "src/modules/info/commands.ts",
    "src/services/api.ts",
    "src/index.ts",
    "dashboard/package.json",
    "dashboard/tsconfig.json",
    "dashboard/postcss.config.js",
    "dashboard/tailwind.config.js",
    "dashboard/src/app/globals.css",
    "dashboard/src/app/layout.tsx",
    "dashboard/src/app/page.tsx"
)
New-BackdatedCommit "2026-07-07T12:00:00" "feat: implement Giveaway, reaction roles, custom embeds, counting game, API server, and Next.js Dashboard" $files7

# Reset Env variables
Remove-Item Env:\GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue
Write-Host "✅ Git backdating complete!"
