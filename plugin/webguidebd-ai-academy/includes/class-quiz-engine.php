<?php
/**
 * Server-side quiz grading.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Quiz_Engine {

	/**
	 * @return array<string,mixed>|null
	 */
	public static function get_quiz( string $quiz_stable_id ): ?array {
		// Quizzes embedded in lesson payload; scan published lessons.
		foreach ( Content_Repository::list_chapters( true ) as $chapter ) {
			foreach ( Content_Repository::list_lessons_for_chapter( (string) $chapter['stable_id'], true ) as $lesson ) {
				$payload = $lesson['payload'] ?? array();
				$quiz    = $payload['quiz'] ?? null;
				if ( is_array( $quiz ) && ( $quiz['stable_id'] ?? '' ) === $quiz_stable_id ) {
					$quiz['lesson_stable_id'] = $lesson['stable_id'];
					return $quiz;
				}
			}
		}
		return null;
	}

	/**
	 * @param array<string,mixed>      $quiz    Quiz definition.
	 * @param array<string,mixed>      $answers Answer map question_id => choice_id|list.
	 * @return array{earned:float,possible:float,passed:bool,feedback:array<int,array<string,mixed>>}
	 */
	public static function grade( array $quiz, array $answers ): array {
		$questions = $quiz['questions'] ?? array();
		$earned    = 0.0;
		$possible  = 0.0;
		$feedback  = array();
		foreach ( $questions as $q ) {
			if ( ! is_array( $q ) ) {
				continue;
			}
			$qid    = (string) ( $q['id'] ?? '' );
			$weight = isset( $q['weight'] ) ? (float) $q['weight'] : 1.0;
			$possible += $weight;
			$correct = $q['correct'] ?? array();
			if ( ! is_array( $correct ) ) {
				$correct = array( $correct );
			}
			$correct = array_map( 'strval', $correct );
			sort( $correct );
			$given = $answers[ $qid ] ?? array();
			if ( ! is_array( $given ) ) {
				$given = array( $given );
			}
			$given = array_map( 'strval', $given );
			sort( $given );
			$ok = $correct === $given;
			if ( $ok ) {
				$earned += $weight;
			}
			$feedback[] = array(
				'id'              => $qid,
				'correct'         => $ok,
				'explanation'     => (string) ( $q['explanation'] ?? '' ),
				'wrong_hint'      => (string) ( $q['wrong_hint'] ?? '' ),
			);
		}
		$pass_ratio = isset( $quiz['pass_ratio'] ) ? (float) $quiz['pass_ratio'] : 0.7;
		$passed     = $possible > 0 && ( $earned / $possible ) >= $pass_ratio;
		return array(
			'earned'   => $earned,
			'possible' => $possible,
			'passed'   => $passed,
			'feedback' => $feedback,
		);
	}
}
