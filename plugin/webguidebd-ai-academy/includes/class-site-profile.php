<?php
/**
 * Founder / contact profile defaults (overridable in settings).
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Site_Profile {

	/**
	 * @return array<string,mixed>
	 */
	public static function defaults(): array {
		return array(
			'author_display_name' => 'Muhibbullah Ansary',
			'author_email'        => 'dev.muhibbullah@gmail.com',
			'author_phone'        => '01770989591',
			'author_phone_e164'   => '+8801770989591',
			'author_role'         => 'Founder, Web Guide BD · Founder & CEO, WPSaleHub · Creator of WooEasyLife',
			'author_location'     => 'বাংলাদেশ',
			'author_linkedin'     => 'https://www.linkedin.com/in/dev-muhib',
			'author_facebook'     => 'https://www.facebook.com/muhib116',
			'author_instagram'    => 'https://www.instagram.com/muhibbullah611/',
			'author_youtube'      => 'https://www.youtube.com/@learnwithmuhib',
			'author_bio'          => self::default_bio_html(),
			'author_expertise'    => self::default_expertise(),
		);
	}

	/**
	 * @return list<array{title:string,body:string}>
	 */
	public static function default_expertise(): array {
		return array(
			array(
				'title' => 'AI ও LLM Engineering শিক্ষা',
				'body'  => 'WebGuideBD AI Academy-তে বাংলায় practical AI engineering শেখান—ধারণা থেকে JavaScript অনুশীলন, গণিত, neural network, Transformer, RAG, agent/evaluation, PyTorch ব্রিজ ও ক্যাপস্টোন পর্যন্ত। সংখ্যা ও কোড যাচাই করে লেখা; অযাচিত ডিগ্রি বা শিক্ষার্থী-সংখ্যা দাবি করা হয় না।',
			),
			array(
				'title' => 'WooCommerce COD অটোমেশন (WooEasyLife)',
				'body'  => 'বাংলাদেশি COD ব্যবসার জন্য WooEasyLife তৈরি করেছেন: মাল্টি-স্টোর ম্যানেজমেন্ট, fraud number ও courier history যাচাই, fake-order সুরক্ষা, Pathao/Steadfast/RedX অটো এন্ট্রি, অর্ডার ওয়ার্কফ্লো এবং Facebook Page COD অপারেশন।',
			),
			array(
				'title' => 'Business Automation ও SaaS',
				'body'  => 'WPSaleHub-এর Founder & CEO হিসেবে ম্যানুয়াল কাজকে অটোমেশনে বদলানো, API/টুল সংযোগ, টিম প্রোডাক্টিভিটি ও ডেটা-চালিত সিদ্ধান্ত—ছোট ও বড় ব্যবসার জন্য ব্যবহারযোগ্য সফটওয়্যার প্ল্যাটফর্ম।',
			),
			array(
				'title' => 'Frontend ও Web Application Development',
				'body'  => '৭+ বছরের অভিজ্ঞতায় Vue.js ও আধুনিক ওয়েব UI, WordPress/WooCommerce ইন্টিগ্রেশন, এবং ক্লায়েন্ট-কেন্দ্রিক প্রোডাক্ট ডেলিভারি। ইন্টারফেসকে সহজ রাখা এবং বাস্তব ব্যবসায়িক সমস্যা সমাধানই ফোকাস।',
			),
			array(
				'title' => 'Digital education (Web Guide BD)',
				'body'  => 'বাংলায় beginner-friendly ওয়েবসাইট, WordPress, domain/hosting ও অনলাইন প্রেজেন্স গাইড—জটিল বিষয়কে ধাপে ধাপে বোঝানোর জন্য Web Guide BD পরিচালনা করেন।',
			),
		);
	}

	public static function default_bio_html(): string {
		return '<p><strong>Muhibbullah Ansary</strong> — software engineer, product builder এবং automation enthusiast। তিনি <strong>Web Guide BD</strong>-এর প্রতিষ্ঠাতা, <strong>WPSaleHub</strong>-এর Founder &amp; CEO, এবং <strong>WooEasyLife</strong>-এর স্রষ্টা।</p>'
			. '<p>কয়েক বছর ধরে তিনি ওয়েব অ্যাপ্লিকেশন, ব্যবসায়িক অটোমেশন, AI/LLM এবং আধুনিক SaaS প্ল্যাটফর্ম নিয়ে কাজ করছেন। অভিজ্ঞতা থেকে দেখেছেন—অনেক ব্যবসা এখনও অপ্রয়োজনীয় ম্যানুয়াল কাজে সময় ও টাকা হারায়। সেই সমস্যা সমাধানেই WooEasyLife ও WPSaleHub গড়ে তুলেছেন।</p>'
			. '<p>এই AI Academy-তে লক্ষ্য: বাংলায় practical AI engineering শেখানো—প্রথমে ধারণা, তারপর হাতে-কলমে কোড, পরে প্রকৌশল ও research track। এখানে কাল্পনিক শিক্ষার্থী-সংখ্যা বা অযাচিত সার্টিফিকেট দাবি করা হয় না; যা শেখানো হয়, তা যাচাইযোগ্য উদাহরণ দিয়ে।</p>';
	}

	/**
	 * @return array<string,mixed>
	 */
	public static function get(): array {
		$settings = get_option( 'wgba_settings', array() );
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}
		$out = self::defaults();
		foreach ( array_keys( $out ) as $key ) {
			if ( 'author_expertise' === $key ) {
				continue;
			}
			if ( isset( $settings[ $key ] ) && is_string( $settings[ $key ] ) && '' !== trim( $settings[ $key ] ) ) {
				$out[ $key ] = $settings[ $key ];
			}
		}
		if ( ! empty( $settings['author_expertise_text'] ) && is_string( $settings['author_expertise_text'] ) ) {
			$parsed = self::parse_expertise_text( $settings['author_expertise_text'] );
			if ( $parsed ) {
				$out['author_expertise'] = $parsed;
			}
		}
		$out['author_photo_id'] = absint( $settings['author_photo_id'] ?? 0 );
		$digits                 = preg_replace( '/\D+/', '', (string) $out['author_phone'] );
		if ( is_string( $digits ) && 11 === strlen( $digits ) && str_starts_with( $digits, '0' ) ) {
			$out['author_phone_e164'] = '+880' . substr( $digits, 1 );
		} elseif ( is_string( $digits ) && str_starts_with( $digits, '880' ) ) {
			$out['author_phone_e164'] = '+' . $digits;
		}
		return $out;
	}

	/**
	 * @return list<array{title:string,body:string}>
	 */
	public static function parse_expertise_text( string $text ): array {
		$blocks = preg_split( '/\n{2,}/', trim( $text ) );
		$out    = array();
		if ( ! is_array( $blocks ) ) {
			return $out;
		}
		foreach ( $blocks as $block ) {
			$lines = preg_split( '/\n/', trim( (string) $block ) );
			if ( ! is_array( $lines ) || ! $lines ) {
				continue;
			}
			$title = trim( (string) array_shift( $lines ) );
			$body  = trim( implode( ' ', $lines ) );
			if ( $title && $body ) {
				$out[] = array(
					'title' => $title,
					'body'  => $body,
				);
			}
		}
		return $out;
	}

	public static function photo_url(): string {
		$p = self::get();
		$id = (int) ( $p['author_photo_id'] ?? 0 );
		if ( $id && wp_attachment_is_image( $id ) ) {
			$url = wp_get_attachment_image_url( $id, 'large' );
			if ( is_string( $url ) && $url ) {
				return $url;
			}
		}
		return add_query_arg( 'ver', WGBA_VERSION, WGBA_PLUGIN_URL . 'assets/img/muhibbullah-ansary.jpg' );
	}

	/**
	 * Brand lockup for light / dark chrome.
	 *
	 * @param 'light'|'dark' $variant Theme variant.
	 */
	public static function logo_url( string $variant = 'light' ): string {
		$file = ( 'dark' === $variant ) ? 'logo-dark.png' : 'logo-light.png';
		return add_query_arg( 'ver', WGBA_VERSION, WGBA_PLUGIN_URL . 'assets/img/' . $file );
	}

	public static function expertise_text_for_admin(): string {
		$settings = get_option( 'wgba_settings', array() );
		if ( is_array( $settings ) && ! empty( $settings['author_expertise_text'] ) ) {
			return (string) $settings['author_expertise_text'];
		}
		$lines = array();
		foreach ( self::default_expertise() as $row ) {
			$lines[] = $row['title'] . "\n" . $row['body'];
		}
		return implode( "\n\n", $lines );
	}
}
