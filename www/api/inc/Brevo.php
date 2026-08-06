<?php
/**
 * Brevo - small, dependency-free client for the Brevo (ex-Sendinblue) API v3.
 *
 * Reusable module: drop this file + a .env into any PHP site and reuse
 * sendEmail() (and addContact() for list capture). Only needs cURL.
 *
 * Docs: https://developers.brevo.com/  (api-key header, JSON body)
 *
 * @package sievax-academy
 */

declare(strict_types=1);

final class Brevo {

	private const BASE = 'https://api.brevo.com/v3';

	public function __construct(
		private string $apiKey,
		private string $senderName,
		private string $senderEmail
	) {}

	/**
	 * Send a transactional email.
	 *
	 * @param array<int,array{email:string,name?:string}> $to        Recipients.
	 * @param string                                       $subject   Subject line.
	 * @param string                                       $html      HTML body.
	 * @param string|null                                  $replyTo   Optional reply-to address.
	 * @param array<string,string>                         $params    Optional template params (unused here).
	 *
	 * @return array{ok:bool,status:int,body:mixed}
	 */
	public function sendEmail( array $to, string $subject, string $html, ?string $replyTo = null, array $params = array() ): array {
		$payload = array(
			'sender'      => array(
				'name'  => $this->senderName,
				'email' => $this->senderEmail,
			),
			'to'          => array_values( $to ),
			'subject'     => $subject,
			'htmlContent' => $html,
		);
		if ( $replyTo ) {
			$payload['replyTo'] = array( 'email' => $replyTo );
		}
		if ( $params ) {
			$payload['params'] = $params;
		}

		return $this->request( 'POST', '/smtp/email', $payload );
	}

	/**
	 * Add / update a contact (kept for reuse on larger sites - not used by the
	 * one-pager, which only sends transactional mail).
	 *
	 * @param array<string,mixed> $attributes
	 * @param array<int,int>      $listIds
	 *
	 * @return array{ok:bool,status:int,body:mixed}
	 */
	public function addContact( string $email, array $attributes = array(), array $listIds = array(), bool $updateEnabled = true ): array {
		$payload = array(
			'email'         => $email,
			'updateEnabled' => $updateEnabled,
		);
		if ( $attributes ) {
			$payload['attributes'] = $attributes;
		}
		if ( $listIds ) {
			$payload['listIds'] = array_map( 'intval', $listIds );
		}

		return $this->request( 'POST', '/contacts', $payload );
	}

	/**
	 * Perform a JSON request against the Brevo API.
	 *
	 * @param array<string,mixed> $payload
	 *
	 * @return array{ok:bool,status:int,body:mixed}
	 */
	private function request( string $method, string $path, array $payload ): array {
		$ch = curl_init( self::BASE . $path );
		curl_setopt_array(
			$ch,
			array(
				CURLOPT_CUSTOMREQUEST  => $method,
				CURLOPT_POSTFIELDS     => json_encode( $payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ),
				CURLOPT_RETURNTRANSFER => true,
				CURLOPT_TIMEOUT        => 15,
				CURLOPT_HTTPHEADER     => array(
					'accept: application/json',
					'content-type: application/json',
					'api-key: ' . $this->apiKey,
				),
			)
		);

		$raw    = curl_exec( $ch );
		$status = (int) curl_getinfo( $ch, CURLINFO_RESPONSE_CODE );
		$err    = curl_error( $ch );
		curl_close( $ch );

		if ( $raw === false ) {
			return array(
				'ok'     => false,
				'status' => 0,
				'body'   => array( 'message' => 'cURL error: ' . $err ),
			);
		}

		$body = json_decode( (string) $raw, true );

		return array(
			'ok'     => $status >= 200 && $status < 300,
			'status' => $status,
			'body'   => $body ?? $raw,
		);
	}
}
