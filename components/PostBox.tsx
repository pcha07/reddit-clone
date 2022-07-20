import { useSession } from "next-auth/react";
import React, { useState } from "react";
import Avatar from "./Avatar";
import { LinkIcon, PhotographIcon } from "@heroicons/react/outline";
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { ADD_POST, ADD_SUBREDDIT } from "../graphql/mutations";
import client from "../apollo-client"
import { GET_ALL_POSTS, GET_SUBREDDIT_BY_TOPIC } from "../graphql/queries"
import toast from "react-hot-toast";

type FormData = {
  postTitle: string;
  postBody: string;
  postImage: string;
  subreddit: string;
};
type Props = {
  subreddit?: string
}

function PostBox({ subreddit }: Props) {
  const { data: session } = useSession();
  const [addPost] = useMutation(ADD_POST)

  const [addSubreddit] = useMutation(ADD_SUBREDDIT);
  const [imageBoxOpen, setImageBoxOpen] = useState<boolean>(false);

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = handleSubmit(async (formData) => {
    console.log(formData);
    console.log(formData.subreddit);


    const notification = toast.loading("creating new post...")
    try {
      //query for the subreddit topic

      const { data: getSubredditListByTopic } = await client.query({
        query: GET_SUBREDDIT_BY_TOPIC,
        variables: {
          topic: subreddit || formData.subreddit
        }
      })
      const subredditExists = getSubredditListByTopic.length > 0;
      if (!subredditExists) {
        //create subreddit
        const { data: { insertSubreddit: newSubreddit } } = await addSubreddit({
          variables: {
            topic: formData.subreddit
          }
        })
        console.log(newSubreddit);

        const image = formData.postImage || "";
        const { data: { insertPost: newPost }, } = await addPost({
          variables: {
            body: formData.postBody,
            image: image,
            subreddit_id: newSubreddit.id,
            title: formData.postTitle,
            username: session?.user?.name
          }
        })
        console.log(newPost);

      } else {
        //use existing subreddit
        const image = formData.postImage || "";
        const { data: { insertPost: newPost } } = await addPost({
          variables: {
            body: formData.postBody,
            image: image,
            subreddit_id: getSubredditListByTopic[0].id,
            title: formData.postTitle,
            username: session?.user?.name
          }
        })
        console.log(newPost);

      }
      //after the post has been added
      setValue("postBody", "")
      setValue("postImage", "")
      setValue("postTitle", "")
      setValue("subreddit", "")
      toast.success("New post created", {
        id: notification
      })
    } catch (error) {
      toast.error("Whoops something went wrong", {
        id: notification
      })
      console.log(error);

    }
  });
  return (
    <form
      onSubmit={onSubmit}
      className="sticky top-16 z-50 bg-white border rouned-md border-gray-300"
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <Avatar />
        <input
          {...register("postTitle", { required: true })}
          type="text"
          disabled={!session}
          className="bg-gray-50 p-2 pl-5 outline-none rounded-md flex-1"
          placeholder={
            session ? subreddit ? `Create a post in r/${subreddit}` : "Create a post by entering a title" : "Sign in to post"
          }
        />
        <PhotographIcon
          onClick={() => setImageBoxOpen(!imageBoxOpen)}
          className={`h-6 text-gray-300 cursor-pointer ${imageBoxOpen && "text-blue-300"
            }`}
        />
        <LinkIcon className="h-6 text-gray-300" />
      </div>
      {!!watch("postTitle") && (
        <div className="flex flex-col py-2">
          {/* Body */}
          <div className="flex items-center px-2">
            <p className="min-w-[90px]">Body:</p>
            <input
              {...register("postBody")}
              type="text"
              placeholder="Text (optional)"
              className="m-2 flex-1 bg-blue-50 p-2 outline-none"
            />
          </div>
          {!subreddit && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Subreddit:</p>
              <input
                {...register("subreddit", { required: true })}
                type="text"
                placeholder="i.e react.js"
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
              />
            </div>
          )}

          {imageBoxOpen && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Image URL:</p>
              <input
                {...register("postImage")}
                type="text"
                placeholder="Optional"
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
              />
            </div>
          )}
          {/* errors */}
          {Object.keys(errors).length > 0 && (
            <div className="space-y-2 p-2 text-red-500">
              {errors.postTitle?.type === "required" && (
                <p>-A Post Title is required</p>
              )}

              {errors.subreddit?.type === "required" && (
                <p>-A Subreddit is required</p>
              )}

            </div>
          )}
          {!!watch("postTitle") && (
            <button

              type="submit"
              className="w-full rouned-full bg-blue-400 p-2 text-white"
            >
              Create Post
            </button>
          )}
        </div>
      )}
    </form>
  );
}

export default PostBox;
