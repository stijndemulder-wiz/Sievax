<?php
/**
 * Minimal .env loader (no Composer). Reads KEY=value lines into $_ENV / getenv.
 * Reusable across small PHP sites. Quotes are stripped; lines starting with # are
 * comments; values may contain '='.
 *
 * Usage:
 *   require __DIR__ . '/env.php';
 *   dotenv_load(__DIR__ . '/../.env');
 *   $key = dotenv_get('BREVO_API_KEY', 'dry');
 */

declare(strict_types=1);

if ( ! function_exists( 'dotenv_load' ) ) {
	/**
	 * Load a .env file into $_ENV (does nothing if the file is absent).
	 */
	function dotenv_load( string $path ): void {
		if ( ! is_file( $path ) || ! is_readable( $path ) ) {
			return;
		}
		$lines = file( $path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES );
		foreach ( $lines as $line ) {
			$line = trim( $line );
			if ( $line === '' || $line[0] === '#' ) {
				continue;
			}
			$parts = explode( '=', $line, 2 );
			if ( count( $parts ) !== 2 ) {
				continue;
			}
			$key = trim( $parts[0] );
			$val = trim( $parts[1] );
			// Strip surrounding single or double quotes.
			if ( strlen( $val ) >= 2 ) {
				$first = $val[0];
				$last  = $val[ strlen( $val ) - 1 ];
				if ( ( $first === '"' && $last === '"' ) || ( $first === "'" && $last === "'" ) ) {
					$val = substr( $val, 1, -1 );
				}
			}
			$_ENV[ $key ] = $val;
		}
	}

	/**
	 * Read a config value with a fallback.
	 */
	function dotenv_get( string $key, string $default = '' ): string {
		if ( array_key_exists( $key, $_ENV ) && $_ENV[ $key ] !== '' ) {
			return (string) $_ENV[ $key ];
		}
		$fromGetenv = getenv( $key );
		return ( $fromGetenv !== false && $fromGetenv !== '' ) ? (string) $fromGetenv : $default;
	}
}
