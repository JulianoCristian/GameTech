/* global Demo */

//------------------------------------------------------------------
//
// Defines a tracking missile fired from a base.  A missile contains a sprite.
// The spec is defined as:
//	{
//		center: { x: , y: },		// In world coordinates
//		target: ,					// Entity to follow
//		momentum: { x: , y: },		// Direction of momentum
//		rotateRate: ,				// Radians per second
//		lifetime:					// How long (in milliseconds) the missle can live
//	}
//
//
//------------------------------------------------------------------
Demo.components.TrackingMissile = function(spec) {
	'use strict';
	var sprite = null,
		that = {
			get type() { return Demo.components.Types.Missile; },
			get center() { return sprite.center; },
			get size() { return spec.size; },
			get momentum() { return spec.momentum; },
			get rotation() { return Math.atan2(spec.momentum.y, spec.momentum.x); },
			get damage() { return 1; },
			get sprite() { return sprite; }
		},
		boundingCircle = {
			get center() { return that.center; },
			get radius() { return that.size.width / 2; }
		};

	Object.defineProperty(that, 'boundingCircle', {
		get: function() { return boundingCircle; },
		enumerable: true,
		configurable: false
	});

	//------------------------------------------------------------------
	//
	// Returns the magnitude of the 2D cross product.  The sign of the
	// magnitude tells you which direction to rotate to close the angle
	// between the two vectors.
	//
	//------------------------------------------------------------------
	function crossProduct2d(v1, v2) {
		return (v1.x * v2.y) - (v1.y * v2.x);
	}

	//------------------------------------------------------------------
	//
	// Computes the angle, and direction (cross product) between two vectors.
	//
	//------------------------------------------------------------------
	function computeAngle(rotation, ptCenter, ptTarget) {
		var v1 = {
				x : Math.cos(rotation),
				y : Math.sin(rotation)
			},
			v2 = {
				x : ptTarget.x - ptCenter.x,
				y : ptTarget.y - ptCenter.y
			},
			dp,
			angle,
			cp;

		v2.len = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
		v2.x /= v2.len;
		v2.y /= v2.len;

		dp = v1.x * v2.x + v1.y * v2.y;
		angle = Math.acos(dp);
		//
		// It is possible to get a NaN result, when that happens, set the angle to
		// 0 so that any use of it doesn't have to check for NaN.
		if (isNaN(angle)) {
			angle = 0;
		}

		//
		// Get the cross product of the two vectors so we can know
		// which direction to rotate.
		cp = crossProduct2d(v1, v2);

		return {
			angle : angle,
			crossProduct : cp
		};
	}

	//------------------------------------------------------------------
	//
	// Update the position of the missile based on its current momentum vector,
	// then tell the underlying sprite model to also update.
	//
	//------------------------------------------------------------------
	that.update = function(elapsedTime) {
		var angleToTarget,
			newRotation,
			magnitude,
			newMagnitude;

		spec.alive += elapsedTime;
		if (spec.alive < spec.lifetime) {
			angleToTarget = computeAngle(that.rotation, that.center, spec.target.center);
			if (Demo.utilities.math.testTolerance(angleToTarget.angle, 0, 0.01) === false) {
				if (angleToTarget.crossProduct > 0) {
					if (angleToTarget.angle > (spec.rotateRate * elapsedTime)) {
						newRotation = that.rotation + (spec.rotateRate * elapsedTime);
					} else {
						newRotation = that.rotation + angleToTarget.angle;
					}
				} else {
					if (angleToTarget.angle > (spec.rotateRate * elapsedTime)) {
						newRotation = that.rotation - (spec.rotateRate * elapsedTime);
					} else {
						newRotation = that.rotation - angleToTarget.angle;
					}
				}

				//
				// Convert the new rotation back into an updated momentum vector.  Have to
				// start by getting the current momentum vector magnitude, because the resulting
				// momentum vector needs to have the same magnitude.
				magnitude = Math.sqrt(Math.pow(that.momentum.x, 2) + Math.pow(that.momentum.y, 2));
				spec.momentum.x = Math.cos(newRotation);
				spec.momentum.y = Math.sin(newRotation);
				newMagnitude = Math.sqrt(Math.pow(that.momentum.x, 2) + Math.pow(that.momentum.y, 2));
				spec.momentum.x = (spec.momentum.x / newMagnitude) * magnitude;
				spec.momentum.y = (spec.momentum.y / newMagnitude) * magnitude;
			}

			sprite.center.x += (spec.momentum.x * elapsedTime);
			sprite.center.y += (spec.momentum.y * elapsedTime);

			sprite.update(elapsedTime);

			return true;
		}

		return false;
	};

	//------------------------------------------------------------------
	//
	// Check to see if the Missle collides with another entity.
	//
	//------------------------------------------------------------------
	that.intersects = function(entity) {
		return Demo.utilities.math.circleCircleIntersect(entity.boundingCircle, that.boundingCircle);
	};

	//------------------------------------------------------------------
	//
	// Called when another entity gets within the 'vicinity' of this entity.
	//
	//------------------------------------------------------------------
	that.vicinity = function(entity) {
		//
		// Nothing to do here
	};

	//------------------------------------------------------------------
	//
	// Used to inform the missle that is collided with something at it's
	// current position.  We'll have it create a small particle explosion
	// when that happens.
	//
	//------------------------------------------------------------------
	that.collide = function(entity) {
		//
		// Only going to generate an effect if we hit another entity, there are
		// times when no entity was actually hit (like the border of the game world).
		if (entity) {
			Demo.components.ParticleSystem.createEffectExplosion({
				center: { x: sprite.center.x, y: sprite.center.y },
				howMany: 25
			});
		}

		return false;
	};

	//
	// Missle knows its own size
	spec.size = { width: 0.04, height: 0.01 };
	spec.alive = 0;

	//
	// Get our sprite model
	sprite = Demo.components.Sprite({
		image: Demo.assets['missile-2'],
		spriteSize: spec.size,			// Let the sprite know about the size also
		spriteCenter: spec.center		// Maintain the center on the sprite
	});

	return that;
};
