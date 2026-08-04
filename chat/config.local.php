<?php
/**
 * Farber.Inc Chat — local server config (LiteSpeed-friendly)
 *
 * This file is require()'d by api.php. It exists because LiteSpeed shared
 * hosting does NOT pass .htaccess SetEnv values to PHP-FPM. Defining the
 * constant here is the most reliable path on Hostinger shared.
 *
 * SECURITY: this file is currently committed to a public GitHub repo, which
 * means the API key is exposed. To rotate:
 *   1. Generate a new key in the MiniMax dashboard (platform.minimax.io)
 *   2. Update the value below
 *   3. git commit + push
 *   4. Delete the old key in the MiniMax dashboard
 */

if (!defined('MINIMAX_API_KEY_FALLBACK')) {
    define('MINIMAX_API_KEY_FALLBACK', 'sk-cp--xI4K_bB0LzzdPbChxcUg3rBybjJ7VfY3KhB4aUXQbVFN1afE5QrEDIgWHxR_rwNEOk8a3juGQwyIrETakPOTsAzcj9gAD851Ig-D72lvpeVeBsZuI8d8j8');
}
