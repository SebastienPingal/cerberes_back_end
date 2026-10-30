export default class conversations_helper {
  /**
   * Validate a list of member ids coming from the client and add the current user to it.
   * Throws if the input is not a non-empty array of positive integers.
   */
  static parse_members_id(raw_members_id: unknown, current_user_id: number): number[] {
    if (!Array.isArray(raw_members_id) || raw_members_id.length === 0) {
      throw new Error('members_id must be a non-empty array')
    }
    if (!raw_members_id.every(id => Number.isInteger(id) && id > 0)) {
      throw new Error('members_id must only contain user ids')
    }
    const members_id = [...new Set<number>([...raw_members_id, current_user_id])]
    if (members_id.length < 2) {
      throw new Error('A conversation needs at least one other member')
    }
    return members_id
  }
}
