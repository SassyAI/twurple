import { NonEnumerable } from '../../Toolkit/Decorators';
import Channel from '../Channel/Channel';
import ChannelPlaceholder from '../Channel/ChannelPlaceholder';
import { UserIdResolvable } from '../../Toolkit/UserTools';
import UserSubscription from './UserSubscription';
import NoSubscriptionProgram from '../NoSubscriptionProgram';
import NotSubscribed from '../NotSubscribed';
import UserFollow from './UserFollow';
import NotFollowing from '../NotFollowing';
import TwitchClient from '../../TwitchClient';
import Stream from '../Stream/Stream';

/** @private */
export interface UserData {
	_id: string;
	bio: string;
	created_at: string;
	name: string;
	display_name: string;
	logo: string;
	type: string;
	updated_at: string;
}

/**
 * A Twitch user.
 */
export default class User {
	/** @private */
	@NonEnumerable protected readonly _client: TwitchClient;

	/** @private */
	constructor(/** @private */ protected _data: UserData, client: TwitchClient) {
		this._client = client;
	}

	/** @private */
	get cacheKey() {
		return this._data._id;
	}

	/**
	 * The ID of the user.
	 */
	get id() {
		return this._data._id;
	}

	/**
	 * The user name of the user.
	 *
	 * @deprecated Use `name` instead.
	 */
	get userName() {
		return this._data.name;
	}

	/**
	 * The user name of the user.
	 */
	get name() {
		return this._data.name;
	}

	/**
	 * The display name of the user.
	 */
	get displayName() {
		return this._data.display_name;
	}

	/**
	 * The URL to the profile picture of the user.
	 */
	get logoUrl() {
		return this._data.logo;
	}

	/**
	 * Retrieves the channel data of the user.
	 */
	async getChannel(): Promise<Channel> {
		return this._client.channels.getChannel(this);
	}

	/**
	 * Gets a channel placeholder object for the user, which can do anything you can do to a channel with just the ID.
	 */
	getChannelPlaceholder() {
		return new ChannelPlaceholder(this._data._id, this._client);
	}

	/**
	 * Retrieves the currently running stream of the user.
	 */
	async getStream(): Promise<Stream> {
		return this.getChannelPlaceholder().getStream();
	}

	/**
	 * Retrieves the subscription data for the user to the given channel.
	 *
	 * Throws if the channel doesn't have a subscription program or the user is not subscribed to it.
	 *
	 * This method requires access to the user. If you only have access to the channel,
	 * use {@ChannelPlaceholder#getSubscriptionBy} instead.
	 *
	 * @param channel The channel you want to get the subscription data for.
	 */
	async getSubscriptionTo(channel: UserIdResolvable): Promise<UserSubscription> {
		return this._client.users.getSubscriptionData(this, channel);
	}

	/**
	 * Checks whether the user is subscribed to the given channel.
	 *
	 * @param channel The channel you want to check the subscription for.
	 */
	async isSubscribedTo(channel: UserIdResolvable): Promise<boolean> {
		try {
			await this.getSubscriptionTo(channel);
			return true;
		} catch (e) {
			if (e instanceof NoSubscriptionProgram || e instanceof NotSubscribed) {
				return false;
			}

			throw e;
		}
	}

	/**
	 * Retrieves a list of channels followed by the user.
	 *
	 * @param page The result page you want to retrieve.
	 * @param limit The number of results you want to retrieve.
	 * @param orderBy The field to order by.
	 * @param orderDirection The direction to order in - ascending or descending.
	 */
	async getFollows(page?: number, limit?: number, orderBy?: 'created_at' | 'last_broadcast' | 'login', orderDirection?: 'asc' | 'desc') {
		return this._client.users.getFollowedChannels(this, page, limit, orderBy, orderDirection);
	}

	/**
	 * Retrieves the follow data of the user to a given channel.
	 *
	 * @param channel The channel to retrieve the follow data for.
	 */
	async getFollowTo(channel: UserIdResolvable): Promise<UserFollow> {
		return this._client.users.getFollowedChannel(this, channel);
	}

	/**
	 * Checks whether the user is following the given channel.
	 *
	 * @param channel The channel to check for the user's follow.
	 */
	async follows(channel: UserIdResolvable): Promise<boolean> {
		try {
			await this.getFollowTo(channel);
			return true;
		} catch (e) {
			if (e instanceof NotFollowing) {
				return false;
			}

			throw e;
		}
	}

	/**
	 * Follows the channel with the authenticated user.
	 */
	async follow() {
		const currentUser = await this._client.users.getMe();
		return currentUser.followChannel(this);
	}

	/**
	 * Unfollows the channel with the authenticated user.
	 */
	async unfollow(): Promise<void> {
		const currentUser = await this._client.users.getMe();
		return currentUser.unfollowChannel(this);
	}
}