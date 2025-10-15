function loadMembers() {
    const members = new Set()
    try {
        const parsed = JSON.parse(process.env.MEMBERS_JSON || '{}')

        // Populate the Set with just the IDs
        for (const id of Object.values(parsed)) {
            members.add(id)
        }
    } catch (e) {
        console.error('Error parsing MEMBERS_JSON:', e)
    }
    return members
}

module.exports = { loadMembers }
