<?php
/**
 * Bengali frontend registration / login / reset.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Auth_Frontend {

	public static function register(): void {
		add_action( 'init', array( self::class, 'handle_posts' ) );
		add_filter( 'login_redirect', array( self::class, 'login_redirect' ), 10, 3 );
	}

	/**
	 * @param mixed              $redirect_to URL.
	 * @param mixed              $requested   Requested.
	 * @param \WP_User|\WP_Error $user        User.
	 * @return string
	 */
	public static function login_redirect( $redirect_to, $requested, $user ): string {
		$redirect_to = is_string( $redirect_to ) ? $redirect_to : '';
		$requested   = is_string( $requested ) ? $requested : '';
		if ( $user instanceof \WP_User && user_can( $user, 'manage_options' ) ) {
			return $redirect_to;
		}
		if ( $requested ) {
			return Access::sanitize_return_url( $requested );
		}
		return Rewrite::url( 'dashboard' );
	}

	public static function handle_posts(): void {
		if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) ) {
			return;
		}
		$action = isset( $_POST['wgba_auth_action'] ) ? sanitize_key( (string) wp_unslash( $_POST['wgba_auth_action'] ) ) : '';
		if ( ! $action ) {
			return;
		}
		if ( ! isset( $_POST['wgba_auth_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_POST['wgba_auth_nonce'] ) ), 'wgba_auth' ) ) {
			wp_die( esc_html__( 'নিরাপত্তা যাচাই ব্যর্থ। আবার চেষ্টা করুন।', 'webguidebd-ai-academy' ) );
		}

		switch ( $action ) {
			case 'register':
				self::do_register();
				break;
			case 'login':
				self::do_login();
				break;
			case 'lost_password':
				self::do_lost_password();
				break;
			case 'reset_password':
				self::do_reset_password();
				break;
			case 'logout':
				wp_logout();
				wp_safe_redirect( Rewrite::url( 'home' ) );
				exit;
		}
	}

	private static function do_register(): void {
		$email = sanitize_email( wp_unslash( (string) ( $_POST['email'] ?? '' ) ) );
		$user  = sanitize_user( wp_unslash( (string) ( $_POST['username'] ?? '' ) ), true );
		$pass  = (string) ( $_POST['password'] ?? '' );
		$return = Access::sanitize_return_url( (string) ( $_POST['redirect_to'] ?? '' ) );

		if ( ! is_email( $email ) || strlen( $pass ) < 8 || ! $user ) {
			self::flash_redirect( 'register', 'invalid', $return );
		}
		if ( username_exists( $user ) || email_exists( $email ) ) {
			self::flash_redirect( 'register', 'exists', $return );
		}

		// Ignore any role fields from request.
		$user_id = wp_create_user( $user, $pass, $email );
		if ( is_wp_error( $user_id ) ) {
			self::flash_redirect( 'register', 'error', $return );
		}
		$user_obj = new \WP_User( $user_id );
		$user_obj->set_role( 'subscriber' );

		wp_set_current_user( $user_id );
		wp_set_auth_cookie( $user_id );
		wp_safe_redirect( $return ?: Rewrite::url( 'dashboard' ) );
		exit;
	}

	private static function do_login(): void {
		$creds = array(
			'user_login'    => sanitize_text_field( wp_unslash( (string) ( $_POST['log'] ?? '' ) ) ),
			'user_password' => (string) ( $_POST['pwd'] ?? '' ),
			'remember'      => ! empty( $_POST['rememberme'] ),
		);
		$return = Access::sanitize_return_url( (string) ( $_POST['redirect_to'] ?? '' ) );
		$user   = wp_signon( $creds, is_ssl() );
		if ( is_wp_error( $user ) ) {
			self::flash_redirect( 'login', 'failed', $return );
		}
		wp_safe_redirect( $return ?: Rewrite::url( 'dashboard' ) );
		exit;
	}

	private static function do_lost_password(): void {
		$login = sanitize_text_field( wp_unslash( (string) ( $_POST['user_login'] ?? '' ) ) );
		// Generic message to reduce enumeration.
		$result = retrieve_password( $login );
		self::flash_redirect( 'lost_password', is_wp_error( $result ) ? 'sent' : 'sent', '' );
	}

	private static function do_reset_password(): void {
		$rp_key   = sanitize_text_field( wp_unslash( (string) ( $_POST['rp_key'] ?? '' ) ) );
		$rp_login = sanitize_text_field( wp_unslash( (string) ( $_POST['rp_login'] ?? '' ) ) );
		$pass1    = (string) ( $_POST['pass1'] ?? '' );
		$pass2    = (string) ( $_POST['pass2'] ?? '' );
		if ( $pass1 !== $pass2 || strlen( $pass1 ) < 8 ) {
			self::flash_redirect( 'reset_password', 'mismatch', '' );
		}
		$user = check_password_reset_key( $rp_key, $rp_login );
		if ( is_wp_error( $user ) ) {
			self::flash_redirect( 'reset_password', 'invalid_key', '' );
		}
		reset_password( $user, $pass1 );
		self::flash_redirect( 'login', 'reset_ok', '' );
	}

	private static function flash_redirect( string $route, string $code, string $return ): void {
		$url = add_query_arg(
			array(
				'wgba_msg' => $code,
				'redirect_to' => $return ? rawurlencode( $return ) : '',
			),
			Rewrite::url( $route )
		);
		wp_safe_redirect( $url );
		exit;
	}
}
