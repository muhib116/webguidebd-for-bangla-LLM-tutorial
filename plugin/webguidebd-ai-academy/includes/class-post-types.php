<?php
/**
 * Course content CPTs.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Post_Types {

	public static function register(): void {
		register_post_type(
			'wgba_chapter',
			array(
				'labels'              => array(
					'name'          => __( 'অধ্যায়', 'webguidebd-ai-academy' ),
					'singular_name' => __( 'অধ্যায়', 'webguidebd-ai-academy' ),
				),
				'public'              => false,
				'show_ui'             => true,
				'show_in_menu'        => 'wgba-academy',
				'show_in_rest'        => false,
				'capability_type'     => 'post',
				'map_meta_cap'        => true,
				'supports'            => array( 'title', 'editor', 'page-attributes', 'revisions' ),
				'has_archive'         => false,
			)
		);

		register_post_type(
			'wgba_lesson',
			array(
				'labels'              => array(
					'name'          => __( 'পাঠ', 'webguidebd-ai-academy' ),
					'singular_name' => __( 'পাঠ', 'webguidebd-ai-academy' ),
				),
				'public'              => false,
				'show_ui'             => true,
				'show_in_menu'        => 'wgba-academy',
				'show_in_rest'        => false,
				'capability_type'     => 'post',
				'map_meta_cap'        => true,
				'supports'            => array( 'title', 'editor', 'page-attributes', 'revisions', 'thumbnail' ),
				'has_archive'         => false,
			)
		);

		register_post_type(
			'wgba_glossary',
			array(
				'labels'       => array(
					'name'          => __( 'শব্দকোষ', 'webguidebd-ai-academy' ),
					'singular_name' => __( 'শব্দ', 'webguidebd-ai-academy' ),
				),
				'public'       => false,
				'show_ui'      => true,
				'show_in_menu' => 'wgba-academy',
				'show_in_rest' => false,
				'supports'     => array( 'title', 'editor' ),
			)
		);

		register_post_type(
			'wgba_project',
			array(
				'labels'       => array(
					'name'          => __( 'প্রজেক্ট', 'webguidebd-ai-academy' ),
					'singular_name' => __( 'প্রজেক্ট', 'webguidebd-ai-academy' ),
				),
				'public'       => false,
				'show_ui'      => true,
				'show_in_menu' => 'wgba-academy',
				'show_in_rest' => false,
				'supports'     => array( 'title', 'editor', 'page-attributes' ),
			)
		);
	}
}
