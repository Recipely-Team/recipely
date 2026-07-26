/**
 * Maximum comment length (characters), shared by the mobile and web comment
 * composers so the two cannot cap at different lengths — one of them would
 * then only fail at submit time, as a bare 400 from the server.
 */
export const COMMENT_MAX_LENGTH = 2000;
